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
    const municipioIndex = findColumnIndex(['Municipio']);
    const distritoIndex = findColumnIndex(['Distrito']);
    const seccionIndex = findColumnIndex(['Sección', 'Seccion']);
    const mesaIndex = findColumnIndex(['Mesa']);
    const censoIndex = findColumnIndex(['electores censados', 'censo']);
    const votantesIndex = findColumnIndex(['total de votantes', 'votantes']);
    const nulosIndex = findColumnIndex(['nulos']);
    const blancosIndex = findColumnIndex(['blanco']);

    console.log('🔍 Column indices found:', {
      foto: fotoIndex,
      municipio: municipioIndex,
      distrito: distritoIndex,
      seccion: seccionIndex,
      mesa: mesaIndex,
      censo: censoIndex,
      votantes: votantesIndex,
      nulos: nulosIndex,
      blancos: blancosIndex
    });

    // Validate required columns
    if (municipioIndex === -1 || distritoIndex === -1 || seccionIndex === -1 || mesaIndex === -1) {
      return new Response(JSON.stringify({ 
        error: 'Required columns not found: Municipio, Distrito, Sección, or Mesa' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find party columns (format: "NOMBRE (SIGLAS)")
    const partyColumns: { index: number; fullName: string; siglas: string }[] = [];
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const match = header.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match && index > blancosIndex) { // Only consider columns after basic vote columns
          const fullName = match[1].trim();
          const siglas = match[2].trim();
          partyColumns.push({ index, fullName, siglas });
        }
      }
    });

    console.log('🎉 Party columns found:', partyColumns);

    // OPTIMIZATION 1: Load and cache all MPCA data with normalized search index
    console.log('🔄 Loading MPCA data...');
    const { data: mpcaData, error: mpcaError } = await supabase
      .from('mpca')
      .select('*');

    if (mpcaError) {
      console.error('❌ Error fetching MPCA data:', mpcaError);
      return new Response(JSON.stringify({ error: 'Error fetching municipality data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OPTIMIZATION 2: Load and cache all political parties
    console.log('🔄 Loading political parties...');
    const { data: politicalParties, error: partiesError } = await supabase
      .from('political_parties')
      .select('*');

    if (partiesError) {
      console.error('❌ Error fetching political parties:', partiesError);
      return new Response(JSON.stringify({ error: 'Error fetching political parties' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create normalized lookup maps for efficient searching
    const municipalityMap = new Map<string, MpcaData>();
    const partyMap = new Map<string, { id: string; name: string; siglas: string; color: string }>();
    
    // Helper function to normalize municipality names for robust comparison
    const normalizeMunicipio = (name: string): string => {
      if (!name || typeof name !== 'string') return '';
      return name
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Build municipality search index
    (mpcaData as MpcaData[]).forEach(municipality => {
      const normalizedName = normalizeMunicipio(municipality.municipio);
      municipalityMap.set(normalizedName, municipality);
    });

    // Build party search index (by siglas, case-insensitive)
    politicalParties?.forEach(party => {
      partyMap.set(party.siglas.toLowerCase(), party);
    });

    console.log(`✅ Cached ${municipalityMap.size} municipalities and ${partyMap.size} parties`);

    // Helper function to convert Google Drive links
    const convertDriveLink = (url: string): string => {
      if (!url || !url.includes('drive.google.com')) return url;
      
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
      return url;
    };

    let processedMesas = 0;
    let createdMesas = 0;
    let updatedMesas = 0;
    let createdParties = 0;
    const errors: string[] = [];
    const maxErrors = 50;

    // Process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      
      try {
        const municipioRaw = row[municipioIndex]?.toString();
        const distritoRaw = row[distritoIndex]?.toString();
        const seccionRaw = row[seccionIndex]?.toString();
        const mesaRaw = row[mesaIndex]?.toString();
        
        if (!municipioRaw || !distritoRaw || !seccionRaw || !mesaRaw) {
          errors.push(`Row ${i + 1}: Missing required mesa data: Municipio, Distrito, Sección, or Mesa`);
          continue;
        }

        // OPTIMIZATION 3: Use cached municipality lookup
        const normalizedMunicipio = normalizeMunicipio(municipioRaw);
        let matchingMpca = municipalityMap.get(normalizedMunicipio);

        // If no exact match found, try fallback search
        if (!matchingMpca) {
          const { data: ilikeMunicipalities } = await supabase
            .from('mpca')
            .select('*')
            .ilike('municipio', `%${municipioRaw.trim()}%`)
            .limit(1);
          
          if (ilikeMunicipalities && ilikeMunicipalities.length > 0) {
            matchingMpca = ilikeMunicipalities[0] as MpcaData;
          }
        }

        if (!matchingMpca) {
          errors.push(`Row ${i + 1}: Municipality not found: "${municipioRaw}"`);
          continue;
        }

        // Construct mesa identifier with proper zero padding
        const distrito = distritoRaw.toString().padStart(2, '0');
        const seccion = seccionRaw.toString().padStart(3, '0');
        const mesaIdentifier = `${distrito}-${seccion}-${mesaRaw}`;

        // Get vote counts
        const censo = parseInt(row[censoIndex]?.toString() || '0') || 0;
        const votantes = parseInt(row[votantesIndex]?.toString() || '0') || 0;
        const nulos = parseInt(row[nulosIndex]?.toString() || '0') || 0;
        const blancos = parseInt(row[blancosIndex]?.toString() || '0') || 0;

        // Get photo URL and convert if it's a Google Drive link
        const fotoUrl = fotoIndex !== -1 ? convertDriveLink(row[fotoIndex]?.toString() || '') : null;

        // Check if electoral act already exists
        const { data: existingAct } = await supabase
          .from('electoral_acts')
          .select('id')
          .eq('election_id', electionId)
          .eq('municipality_idm', matchingMpca.idm)
          .eq('mesa_identifier', mesaIdentifier)
          .single();

        let actId: string;

        if (existingAct) {
          // Update existing act  
          const { data: updatedAct, error: updateError } = await supabase
            .from('electoral_acts')
            .update({
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl,
              updated_at: new Date().toISOString(),
              updated_by: null // Set to null since this is an automated import
            })
            .eq('id', existingAct.id)
            .select('id')
            .single();

          if (updateError) {
            errors.push(`Row ${i + 1}: Error updating electoral act: ${updateError.message}`);
            continue;
          }
          actId = updatedAct.id;
          updatedMesas++;

          // Delete existing party votes for this act
          await supabase
            .from('party_votes')
            .delete()
            .eq('electoral_act_id', actId);
        } else {
          // Create new electoral act
          const { data: newAct, error: insertError } = await supabase
            .from('electoral_acts')
            .insert({
              election_id: electionId,
              municipality_idm: matchingMpca.idm,
              mesa_identifier: mesaIdentifier,
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl
            })
            .select('id')
            .single();

          if (insertError) {
            errors.push(`Row ${i + 1}: Error creating electoral act: ${insertError.message}`);
            continue;
          }
          actId = newAct.id;
          createdMesas++;
          console.log(`✅ Created new mesa: ${mesaIdentifier}`);
        }

        // OPTIMIZATION 4: Collect party votes for batch processing
        const partyVotesToInsert: { electoral_act_id: string; party_id: string; votes: number }[] = [];
        
        for (const partyCol of partyColumns) {
          const votes = parseInt(row[partyCol.index]?.toString() || '0') || 0;
          
          if (votes > 0) {
            // OPTIMIZATION 5: Use cached party lookup
            let existingParty = partyMap.get(partyCol.siglas.toLowerCase());

            let partyId = existingParty?.id;

            if (!existingParty) {
              // Create new party with lowercase ID for consistency
              partyId = partyCol.siglas.toLowerCase();
              const newParty = {
                id: partyId,
                name: partyCol.fullName,
                siglas: partyCol.siglas,
                color: '#6B7280' // Default color
              };

              const { error: partyError } = await supabase
                .from('political_parties')
                .insert(newParty);

              if (partyError) {
                console.error('Error creating party:', partyError);
                errors.push(`Row ${i + 1}: Error creating party ${partyCol.siglas}: ${partyError.message}`);
                continue;
              } else {
                // Add to cache for future lookups
                partyMap.set(partyCol.siglas.toLowerCase(), newParty);
                createdParties++;
              }
            }

            // Add to batch insert
            partyVotesToInsert.push({
              electoral_act_id: actId,
              party_id: partyId,
              votes: votes
            });
          }
        }

        // OPTIMIZATION 6: Batch insert party votes
        if (partyVotesToInsert.length > 0) {
          const { error: voteError } = await supabase
            .from('party_votes')
            .insert(partyVotesToInsert);

          if (voteError) {
            errors.push(`Row ${i + 1}: Error inserting votes: ${voteError.message}`);
          }
        }

        processedMesas++;
        
        // OPTIMIZATION 7: Reduce logging frequency to avoid CPU timeout
        if (processedMesas % 10 === 0 || processedMesas === jsonData.length - 1) {
          console.log(`✅ Processed ${processedMesas}/${jsonData.length - 1} mesas (${Math.round((processedMesas / (jsonData.length - 1)) * 100)}%)`);
        }

      } catch (error) {
        const errorMsg = `Row ${i + 1}: Unexpected error: ${error.message}`;
        console.error(errorMsg);
        if (errors.length < maxErrors) {
          errors.push(errorMsg);
        }
      }
    }

    const result: ProcessingResult = {
      success: true,
      processedMesas,
      createdMesas,
      updatedMesas,
      createdParties,
      totalRows: jsonData.length - 1,
      errors: errors.slice(0, maxErrors),
      hasMoreErrors: errors.length > maxErrors
    };

    console.log('🎯 Processing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ 
      error: `Processing failed: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});