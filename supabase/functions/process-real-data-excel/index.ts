import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  unresolvedMunicipalities?: UnresolvedMunicipality[];
  unresolvedParties?: UnresolvedParty[];
  // Batch processing fields
  batchComplete?: boolean;
  currentBatch?: number;
  totalBatches?: number;
  nextBatchStart?: number;
  progressPercentage?: number;
}

interface UnresolvedMunicipality {
  originalName: string;
  normalizedName: string;
  rowIndex: number;
  provincia?: string;
  ca?: string;
}

interface UnresolvedParty {
  originalName: string;
  normalizedName: string;
  columnIndex: number;
}

interface MpcaData {
  idm: number;
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
  idc: string;
}

interface MunicipalityResolution {
  originalName: string;
  resolvedIdm: number;
}

interface PartyResolution {
  originalName: string;
  resolvedPartyId: string;
}

serve(async (req) => {
  console.log('🚀 Real data Excel processing function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sourceType = formData.get('sourceType') as string;
    const electionId = formData.get('electionId') as string;

    // Get optional batch processing and resolution parameters
    const batchStart = formData.get('batchStart') ? parseInt(formData.get('batchStart') as string) : 0;
    const batchSize = formData.get('batchSize') ? parseInt(formData.get('batchSize') as string) : 100;
    const batchMode = formData.get('batchMode') === 'true';
    const resolutionsJson = formData.get('resolutions') as string;
    const partyResolutionsJson = formData.get('partyResolutions') as string;
    
    let municipalityResolutions = new Map<string, number>();
    if (resolutionsJson) {
      try {
        const resolutions: MunicipalityResolution[] = JSON.parse(resolutionsJson);
        resolutions.forEach(resolution => {
          const normalizedName = resolution.originalName
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ');
          municipalityResolutions.set(normalizedName, resolution.resolvedIdm);
        });
      } catch (error) {
        console.error('❌ Error parsing municipality resolutions:', error);
      }
    }

    let partyResolutions = new Map<string, string>();
    if (partyResolutionsJson) {
      try {
        const resolutions: PartyResolution[] = JSON.parse(partyResolutionsJson);
        resolutions.forEach(resolution => {
          const normalizedName = resolution.originalName
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ');
          partyResolutions.set(normalizedName, resolution.resolvedPartyId);
        });
      } catch (error) {
        console.error('❌ Error parsing party resolutions:', error);
      }
    }

    if (!file || !sourceType || !electionId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: file, sourceType, or electionId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Processing real data Excel file: ${file.name}`);

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData || jsonData.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Excel file must have at least 2 rows (header + data)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Found ${jsonData.length} rows in Excel`);
    
    // Calculate batch information
    const totalDataRows = jsonData.length - 1; // Exclude header
    const totalBatches = Math.ceil(totalDataRows / batchSize);
    const currentBatch = Math.floor(batchStart / batchSize) + 1;
    const isBatchMode = batchMode;
    
    console.log(`📦 Batch processing: ${currentBatch}/${totalBatches} (rows ${batchStart + 1}-${Math.min(batchStart + batchSize, totalDataRows) + 1}/${totalDataRows})`);

    // Parse headers and find column indices
    const headers = jsonData[0] as string[];
    console.log(`📋 Headers found:`, headers);

    // System column filters (comprehensive list to avoid treating them as parties)
    const systemColumns = [
      'fotografía', 'foto', 'imagen', 'image',
      'municipio', 'municipality', 'ciudad', 'city',
      'distrito', 'district', 
      'sección', 'section', 'seccion',
      'mesa', 'table', 'polling',
      'censo', 'census', 'electores', 'voters', 'número de electores censados', 'numero de electores censados',
      'votantes', 'total voters', 'total votantes', 'número total de votantes', 'numero total de votantes',
      'blancos', 'blank', 'votos en blanco', 'blank votes',
      'nulos', 'null', 'invalid', 'votos nulos', 'null votes', 'invalid votes',
      'suma', 'total', 'suma votos', 'total votes',
      '=', 'diferencia', 'difference', 'no han votado', 'abstenciones'
    ];

    // Enhanced function to check if a column is a system column
    const isSystemColumn = (header: string): boolean => {
      const normalizedHeader = header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      return systemColumns.some(systemCol => {
        const normalizedSystemCol = systemCol.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalizedHeader.includes(normalizedSystemCol) || normalizedSystemCol.includes(normalizedHeader);
      });
    };

    // Find column indices using fuzzy matching for better recognition
    const findColumnIndex = (headers: string[], searchTerms: string[]): number => {
      const normalizeHeader = (header: string) => 
        header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      for (let i = 0; i < headers.length; i++) {
        const header = normalizeHeader(headers[i] || '');
        for (const term of searchTerms) {
          const normalizedTerm = normalizeHeader(term);
          if (header.includes(normalizedTerm) || normalizedTerm.includes(header)) {
            return i;
          }
        }
      }
      return -1;
    };

    const fotoIndex = findColumnIndex(headers, ['fotografía', 'foto', 'imagen', 'image']);
    const municipioIndex = findColumnIndex(headers, ['municipio', 'municipality']);
    const mesaIndex = findColumnIndex(headers, ['mesa', 'table', 'polling']);
    const censoIndex = findColumnIndex(headers, ['censo', 'census', 'electores', 'número de electores censados', 'numero de electores censados']);
    const votantesIndex = findColumnIndex(headers, ['votantes', 'total voters', 'número total de votantes', 'numero total de votantes']);
    const blancosIndex = findColumnIndex(headers, ['blancos', 'blank', 'votos en blanco', 'blank votes']);
    const nulosIndex = findColumnIndex(headers, ['nulos', 'null', 'invalid', 'votos nulos', 'null votes']);

    console.log(`📍 Column indices found:`, {
      foto: fotoIndex,
      municipio: municipioIndex,
      mesa: mesaIndex,
      censo: censoIndex,
      votantes: votantesIndex,
      blancos: blancosIndex,
      nulos: nulosIndex
    });

    // Filter out system columns to find party columns (improved logic)
    const systemColumnIndices = new Set([
      fotoIndex, municipioIndex, mesaIndex, censoIndex, 
      votantesIndex, blancosIndex, nulosIndex
    ].filter(index => index !== -1));

    const partyColumnIndices: number[] = [];
    headers.forEach((header, index) => {
      // Only add if: not a system column index AND not a recognized system column name AND has content
      if (!systemColumnIndices.has(index) && 
          header && 
          header.trim() && 
          !isSystemColumn(header)) {
        partyColumnIndices.push(index);
      }
    });

    console.log(`🎯 Found ${partyColumnIndices.length} party columns:`, 
      partyColumnIndices.map(index => headers[index]));

    // Load data efficiently - single queries for caching
    console.log('📥 Loading municipality and party data...');
    
    const { data: mpcaData, error: mpcaError } = await supabase
      .from('mpca')
      .select('idm, municipio, idp, provincia, idca, ca, idc');
    
    if (mpcaError) {
      console.error('❌ Error fetching municipality data:', mpcaError);
      throw new Error('Failed to load municipality data');
    }

    const { data: partiesData, error: partiesError } = await supabase
      .from('political_parties')
      .select('id, name, siglas, color');
    
    if (partiesError) {
      console.error('❌ Error fetching political parties:', partiesError);
      throw new Error('Failed to load political parties data');
    }

    // Create efficient lookups
    const municipalityMap = new Map<string, MpcaData>();
    const municipalityByIdMap = new Map<number, MpcaData>();
    (mpcaData || []).forEach(item => {
      const normalizedName = normalizeText(item.municipio);
      const municipalityData: MpcaData = {
        idm: item.idm,
        municipio: item.municipio,
        idp: item.idp,
        provincia: item.provincia,
        idca: item.idca,
        ca: item.ca,
        idc: item.idc,
      };
      municipalityMap.set(normalizedName, municipalityData);
      municipalityByIdMap.set(item.idm, municipalityData);
    });

    const partyMap = new Map<string, any>();
    (partiesData || []).forEach(party => {
      const normalizedName = normalizeText(party.name);
      const normalizedSiglas = normalizeText(party.siglas || '');
      partyMap.set(normalizedName, party);
      if (normalizedSiglas) {
        partyMap.set(normalizedSiglas, party);
      }
    });

    console.log(`🏛️ Loaded ${municipalityMap.size} municipalities and ${partyMap.size} parties`);

    // Normalize text function
    function normalizeText(text: string): string {
      return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ');
    }

    // Enhanced municipality lookup function
    function findMunicipality(municipioName: string): MpcaData | null {
      const normalized = normalizeText(municipioName);
      
      // Direct match
      if (municipalityMap.has(normalized)) {
        return municipalityMap.get(normalized)!;
      }

      // Try partial matches
      for (const [key, value] of municipalityMap.entries()) {
        if (key.includes(normalized) || normalized.includes(key)) {
          console.log(`🔍 Partial match found: "${municipioName}" -> "${value.municipio}"`);
          return value;
        }
      }

      return null;
    }

    // Process data and collect unresolved municipalities and parties
    const unresolvedMunicipalities: UnresolvedMunicipality[] = [];
    const unresolvedParties: UnresolvedParty[] = [];
    const mesaDataList: any[] = [];
    let processedCount = 0;
    const errors: string[] = [];
    const MAX_ERRORS = 50;

    // Process only the current batch range
    const startIndex = isBatchMode ? batchStart + 1 : 1; // +1 to skip header
    const endIndex = isBatchMode ? Math.min(batchStart + batchSize + 1, jsonData.length) : jsonData.length;
    
    // First pass: identify all unresolved municipalities in current batch
    for (let i = startIndex; i < endIndex; i++) {
      const row = jsonData[i] as any[];
      
      if (!row || row.length === 0) continue;

      const municipioName = row[municipioIndex]?.toString()?.trim();
      if (!municipioName) continue;

      const normalizedMunicipio = normalizeText(municipioName);
      
      // Check if we have a resolution for this municipality
      let municipalityData: MpcaData | null = null;
      
      if (municipalityResolutions.has(normalizedMunicipio)) {
        const resolvedIdm = municipalityResolutions.get(normalizedMunicipio)!;
        municipalityData = municipalityByIdMap.get(resolvedIdm) || null;
      } else {
        municipalityData = findMunicipality(municipioName);
      }

      if (!municipalityData) {
        // Check if we already have this unresolved municipality
        const alreadyExists = unresolvedMunicipalities.some(
          unresolved => normalizeText(unresolved.originalName) === normalizedMunicipio
        );
        
        if (!alreadyExists) {
          unresolvedMunicipalities.push({
            originalName: municipioName,
            normalizedName: normalizedMunicipio,
            rowIndex: i
          });
        }
        continue;
      }

      // Store for processing
      mesaDataList.push({
        rowIndex: i,
        row,
        municipalityData
      });
    }

    // Check for unresolved parties in party columns
    for (const partyIndex of partyColumnIndices) {
      const partyName = headers[partyIndex]?.toString()?.trim();
      if (!partyName) continue;

      const normalizedPartyName = normalizeText(partyName);
      
      // Check if we have a resolution for this party
      let partyExists = false;
      
      if (partyResolutions.has(normalizedPartyName)) {
        partyExists = true;
      } else {
        // Check if party exists in database
        partyExists = partyMap.has(normalizedPartyName);
      }

      if (!partyExists) {
        // Check if we already have this unresolved party
        const alreadyExists = unresolvedParties.some(
          unresolved => normalizeText(unresolved.originalName) === normalizedPartyName
        );
        
        if (!alreadyExists) {
          unresolvedParties.push({
            originalName: partyName,
            normalizedName: normalizedPartyName,
            columnIndex: partyIndex
          });
        }
      }
    }

    // If we have unresolved items and no resolutions provided, pause for resolution
    if ((unresolvedMunicipalities.length > 0 && !resolutionsJson) || 
        (unresolvedParties.length > 0 && !partyResolutionsJson)) {
      
      let pauseReason = '';
      if (unresolvedMunicipalities.length > 0 && !resolutionsJson) {
        pauseReason += `${unresolvedMunicipalities.length} municipios sin resolver`;
      }
      if (unresolvedParties.length > 0 && !partyResolutionsJson) {
        if (pauseReason) pauseReason += ' y ';
        pauseReason += `${unresolvedParties.length} partidos sin resolver`;
      }
      
      console.log(`⏸️ Found ${pauseReason}. Pausing for resolution.`);
      
      const result: ProcessingResult = {
        success: false,
        processed: 0,
        created: 0,
        updated: 0,
        errors: [],
        unresolvedMunicipalities: unresolvedMunicipalities.length > 0 ? unresolvedMunicipalities : undefined,
        unresolvedParties: unresolvedParties.length > 0 ? unresolvedParties : undefined,
        batchComplete: false,
        currentBatch: isBatchMode ? Math.floor(batchStart / batchSize) + 1 : 1,
        totalBatches: isBatchMode ? Math.ceil((jsonData.length - 1) / batchSize) : 1,
        nextBatchStart: batchStart,
        progressPercentage: 0
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Processing ${mesaDataList.length} mesas...`);

    // Process the mesas
    let createdMesas = 0;
    let updatedMesas = 0;
    let createdParties = 0;

    for (const mesaData of mesaDataList) {
      const { row, municipalityData, rowIndex } = mesaData;
      
      try {
        const mesaIdentifier = row[mesaIndex]?.toString()?.trim();
        if (!mesaIdentifier) {
          if (errors.length < MAX_ERRORS) {
            errors.push(`Fila ${rowIndex + 1}: Mesa identifier vacío`);
          }
          continue;
        }

        const censo = parseInt(row[censoIndex]?.toString() || '0') || 0;
        const votantes = parseInt(row[votantesIndex]?.toString() || '0') || 0;
        const blancos = parseInt(row[blancosIndex]?.toString() || '0') || 0;
        const nulos = parseInt(row[nulosIndex]?.toString() || '0') || 0;
        const fotoUrl = row[fotoIndex]?.toString()?.trim() || null;

        // Generate full identifier
        const fullIdentifier = `${String(municipalityData.idca).padStart(2, '0')}-${String(municipalityData.idp).padStart(2, '0')}-${municipalityData.idc}-${mesaIdentifier}`;

        // Check if electoral act exists
        const { data: existingAct, error: findError } = await supabase
          .from('electoral_acts')
          .select('id')
          .eq('municipality_idm', municipalityData.idm)
          .eq('mesa_identifier', mesaIdentifier)
          .eq('election_id', electionId)
          .maybeSingle();

        if (findError) {
          console.error('❌ Error finding existing act:', findError);
          if (errors.length < MAX_ERRORS) {
            errors.push(`Fila ${rowIndex + 1}: Error buscando acta existente - ${findError.message}`);
          }
          continue;
        }

        let actId: string;

        if (existingAct) {
          // Update existing act
          const { error: updateError } = await supabase
            .from('electoral_acts')
            .update({
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl,
              full_identifier: fullIdentifier,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAct.id);

          if (updateError) {
            console.error('❌ Error updating electoral act:', updateError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error actualizando acta electoral - ${updateError.message}`);
            }
            continue;
          }

          actId = existingAct.id;
          updatedMesas++;

          // Delete existing party votes for this act
          await supabase
            .from('party_votes')
            .delete()
            .eq('electoral_act_id', actId);

        } else {
          // Create new act
          const { data: newAct, error: insertError } = await supabase
            .from('electoral_acts')
            .insert({
              election_id: electionId,
              municipality_idm: municipalityData.idm,
              mesa_identifier: mesaIdentifier,
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl,
              full_identifier: fullIdentifier
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Error creating electoral act:', insertError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error creando acta electoral - ${insertError.message}`);
            }
            continue;
          }

          actId = newAct.id;
          createdMesas++;
        }

        // Process party votes for this act
        const partyVotesToInsert = [];
        
        for (const partyIndex of partyColumnIndices) {
          const partyName = headers[partyIndex]?.toString()?.trim();
          if (!partyName) continue;

          const normalizedPartyName = normalizeText(partyName);
          const votes = parseInt(row[partyIndex]?.toString() || '0') || 0;
          
          if (votes <= 0) continue;

          let party = partyMap.get(normalizedPartyName);
          
          // Check if we have a resolution for this party
          if (!party && partyResolutions.has(normalizedPartyName)) {
            const resolvedPartyId = partyResolutions.get(normalizedPartyName)!;
            // Find party by resolved ID
            for (const [key, value] of partyMap.entries()) {
              if (value.id === resolvedPartyId) {
                party = value;
                break;
              }
            }
          }
          
          if (!party) {
            // Skip this party - it should have been resolved in the resolution step
            console.warn(`⚠️ Skipping unresolved party: ${partyName}`);
            continue;
          }

          partyVotesToInsert.push({
            electoral_act_id: actId,
            party_id: party.id,
            votes: votes
          });
        }

        // Insert party votes in batch
        if (partyVotesToInsert.length > 0) {
          const { error: partyVotesError } = await supabase
            .from('party_votes')
            .insert(partyVotesToInsert);

          if (partyVotesError) {
            console.error('❌ Error inserting party votes:', partyVotesError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error insertando votos de partidos - ${partyVotesError.message}`);
            }
            continue;
          }
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing row ${rowIndex + 1}:`, error);
        if (errors.length < MAX_ERRORS) {
          errors.push(`Fila ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    // Calculate batch completion status
    const nextBatchStart = batchStart + batchSize;
    const batchComplete = !isBatchMode || nextBatchStart >= totalDataRows;
    const progressPercentage = isBatchMode 
      ? Math.round((Math.min(batchStart + batchSize, totalDataRows) / totalDataRows) * 100)
      : 100;

    const result: ProcessingResult = {
      success: errors.length === 0,
      processed: processedCount,
      created: createdMesas,
      updated: updatedMesas,
      errors: errors.slice(0, MAX_ERRORS),
      batchComplete,
      currentBatch: isBatchMode ? currentBatch : 1,
      totalBatches: isBatchMode ? totalBatches : 1,
      nextBatchStart: batchComplete ? undefined : nextBatchStart,
      progressPercentage
    };

    console.log(`✅ Batch ${currentBatch}/${totalBatches} completed: ${processedCount} processed, ${createdMesas} created, ${updatedMesas} updated`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    } as ProcessingResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});