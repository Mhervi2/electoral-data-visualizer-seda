import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  processedMesas: number;
  createdMesas: number;
  updatedMesas: number;
  createdParties: number;
  totalRows: number;
  errors: string[];
  hasMoreErrors: boolean;
  unresolvedMunicipalities?: UnresolvedMunicipality[];
  pausedForResolution?: boolean;
}

interface UnresolvedMunicipality {
  originalName: string;
  normalizedName: string;
  rowIndex: number;
  provincia?: string;
  ca?: string;
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
    const resolutionsData = formData.get('resolutions') as string;

    // Parse municipality resolutions if provided
    let municipalityResolutions: Map<string, number> = new Map();
    if (resolutionsData) {
      try {
        const resolutions: MunicipalityResolution[] = JSON.parse(resolutionsData);
        resolutions.forEach(resolution => {
          municipalityResolutions.set(
            normalizeText(resolution.originalName),
            resolution.resolvedIdm
          );
        });
        console.log(`📋 Loaded ${municipalityResolutions.size} municipality resolutions`);
      } catch (error) {
        console.error('❌ Error parsing resolutions:', error);
      }
    }

    if (!file || !sourceType || !electionId) {
      console.error('❌ Missing required fields:', { file: !!file, sourceType, electionId });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: file, sourceType, or electionId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Processing real data Excel file:', file.name);

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

    // Parse headers and find column indices
    const headers = jsonData[0] as string[];
    console.log('📋 Headers found:', headers);

    // Find column indices with fuzzy matching
    const findColumnIndex = (patterns: string[]) => {
      return headers.findIndex(header => 
        patterns.some(pattern => 
          header?.toLowerCase().includes(pattern.toLowerCase()) ||
          header?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(pattern.toLowerCase())
        )
      );
    };

    const fotoIndex = findColumnIndex(['Fotografía', 'Fotografia', 'foto']);
    const municipioIndex = findColumnIndex(['Municipio', 'municipio']);
    const mesaIndex = findColumnIndex(['Mesa', 'mesa']);
    const censoIndex = findColumnIndex(['Censo', 'censo']);
    const votantesIndex = findColumnIndex(['Votantes', 'votantes']);
    const blancosIndex = findColumnIndex(['Blancos', 'blancos', 'votos blancos', 'voto blanco']);
    const nulosIndex = findColumnIndex(['Nulos', 'nulos', 'votos nulos', 'voto nulo']);

    console.log('📍 Column indices found:', {
      foto: fotoIndex,
      municipio: municipioIndex,
      mesa: mesaIndex,
      censo: censoIndex,
      votantes: votantesIndex,
      blancos: blancosIndex,
      nulos: nulosIndex
    });

    if (municipioIndex === -1 || mesaIndex === -1) {
      return new Response(JSON.stringify({ 
        error: 'Required columns not found: Municipio and Mesa are mandatory' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find party columns (all columns that are not recognized as system columns)
    const systemColumnIndices = new Set([
      fotoIndex, municipioIndex, mesaIndex, censoIndex, 
      votantesIndex, blancosIndex, nulosIndex
    ].filter(index => index !== -1));

    const partyColumnIndices: number[] = [];
    headers.forEach((header, index) => {
      if (!systemColumnIndices.has(index) && header && header.trim()) {
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

    // Process data and collect unresolved municipalities
    const unresolvedMunicipalities: UnresolvedMunicipality[] = [];
    const mesaDataList: any[] = [];
    let processedCount = 0;
    const errors: string[] = [];
    const MAX_ERRORS = 50;

    // First pass: identify all unresolved municipalities
    for (let i = 1; i < jsonData.length; i++) {
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

    // If we have unresolved municipalities and no resolutions provided, pause for resolution
    if (unresolvedMunicipalities.length > 0 && !resolutionsData) {
      console.log(`⏸️ Found ${unresolvedMunicipalities.length} unresolved municipalities. Pausing for resolution.`);
      
      return new Response(JSON.stringify({
        success: false,
        processedMesas: 0,
        createdMesas: 0,
        updatedMesas: 0,
        createdParties: 0,
        totalRows: jsonData.length - 1,
        errors: [],
        hasMoreErrors: false,
        unresolvedMunicipalities,
        pausedForResolution: true
      } as ProcessingResult), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Processing ${mesaDataList.length} mesas...`);

    // Process the mesas
    let createdMesas = 0;
    let updatedMesas = 0;
    const createdParties = new Set<string>();

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
        const { data: existingAct } = await supabase
          .from('electoral_acts')
          .select('id, version')
          .eq('municipality_idm', municipalityData.idm)
          .eq('mesa_identifier', mesaIdentifier)
          .eq('election_id', electionId)
          .maybeSingle();

        let electoralActId: string;

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

          electoralActId = existingAct.id;
          updatedMesas++;

          // Delete existing party votes for this act
          await supabase
            .from('party_votes')
            .delete()
            .eq('electoral_act_id', electoralActId);

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

          electoralActId = newAct.id;
          createdMesas++;
        }

        // Process party votes in batches
        const partyVotesToInsert: any[] = [];

        for (const partyColumnIndex of partyColumnIndices) {
          const partyName = headers[partyColumnIndex]?.trim();
          const votes = parseInt(row[partyColumnIndex]?.toString() || '0') || 0;

          if (!partyName || votes === 0) continue;

          const normalizedPartyName = normalizeText(partyName);
          let party = partyMap.get(normalizedPartyName);

          if (!party) {
            // Create new party
            const { data: newParty, error: partyError } = await supabase
              .from('political_parties')
              .insert({
                name: partyName,
                siglas: partyName.length <= 10 ? partyName : partyName.substring(0, 10),
                color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
              })
              .select()
              .single();

            if (partyError) {
              console.error('❌ Error creating party:', partyError);
              if (errors.length < MAX_ERRORS) {
                errors.push(`Fila ${rowIndex + 1}: Error creando partido "${partyName}" - ${partyError.message}`);
              }
              continue;
            }

            party = newParty;
            partyMap.set(normalizedPartyName, party);
            createdParties.add(party.id);
          }

          partyVotesToInsert.push({
            electoral_act_id: electoralActId,
            party_id: party.id,
            votes
          });
        }

        // Insert party votes in batch
        if (partyVotesToInsert.length > 0) {
          const { error: votesError } = await supabase
            .from('party_votes')
            .insert(partyVotesToInsert);

          if (votesError) {
            console.error('❌ Error inserting party votes:', votesError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error insertando votos de partidos - ${votesError.message}`);
            }
          }
        }

        processedCount++;
        
        // Progress logging every 100 rows
        if (processedCount % 100 === 0) {
          console.log(`✅ Processed ${processedCount}/${mesaDataList.length} mesas (${Math.round(processedCount/mesaDataList.length*100)}%)`);
        }

      } catch (error) {
        console.error(`❌ Error processing row ${rowIndex + 1}:`, error);
        if (errors.length < MAX_ERRORS) {
          errors.push(`Fila ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    const hasMoreErrors = errors.length >= MAX_ERRORS;
    
    console.log(`✅ Processing completed: ${processedCount} mesas processed, ${createdMesas} created, ${updatedMesas} updated, ${createdParties.size} parties created`);

    const result: ProcessingResult = {
      success: errors.length === 0,
      processedMesas: processedCount,
      createdMesas,
      updatedMesas,
      createdParties: createdParties.size,
      totalRows: jsonData.length - 1,
      errors,
      hasMoreErrors
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      processedMesas: 0,
      createdMesas: 0,
      updatedMesas: 0,
      createdParties: 0,
      totalRows: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      hasMoreErrors: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});