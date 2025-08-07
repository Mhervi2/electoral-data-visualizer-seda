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

    // Get all MPCA data for municipality matching
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

    // Helper function to normalize municipality names
    const normalizeMunicipio = (name: string): string => {
      return name
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove accents
    };

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

        // Find matching municipality by name
        const normalizedMunicipio = normalizeMunicipio(municipioRaw);
        console.log(`🔍 Looking for municipality: "${municipioRaw}" (normalized: "${normalizedMunicipio}")`);
        
        const matchingMpca = (mpcaData as MpcaData[]).find(m => 
          normalizeMunicipio(m.municipio) === normalizedMunicipio
        );

        if (!matchingMpca) {
          errors.push(`Row ${i + 1}: Municipality not found: "${municipioRaw}"`);
          continue;
        }

        console.log(`✅ Found municipality: ${matchingMpca.municipio} (IDM: ${matchingMpca.idm})`);

        // Construct mesa identifier with proper zero padding
        const distrito = distritoRaw.toString().padStart(2, '0');
        const seccion = seccionRaw.toString().padStart(3, '0');
        const mesaIdentifier = `${distrito}-${seccion}-${mesaRaw}`;

        console.log(`📍 Mesa identifier: ${mesaIdentifier}`);

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
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAct.id)
            .select('id')
            .single();

          if (updateError) {
            errors.push(`Row ${i + 1}: Error updating electoral act: ${updateError.message}`);
            continue;
          }
          actId = updatedAct.id;

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
        }

        // Process party votes
        for (const partyCol of partyColumns) {
          const votes = parseInt(row[partyCol.index]?.toString() || '0') || 0;
          
          if (votes > 0) {
            // Create or get political party
            const { data: existingParty } = await supabase
              .from('political_parties')
              .select('id')
              .eq('siglas', partyCol.siglas)
              .single();

            if (!existingParty) {
              const { error: partyError } = await supabase
                .from('political_parties')
                .insert({
                  id: partyCol.siglas,
                  name: partyCol.fullName,
                  siglas: partyCol.siglas,
                  color: '#6B7280' // Default color
                });

              if (partyError) {
                console.error('Error creating party:', partyError);
              } else {
                createdParties++;
                console.log(`✅ Created party: ${partyCol.fullName} (${partyCol.siglas})`);
              }
            }

            // Insert party vote
            const { error: voteError } = await supabase
              .from('party_votes')
              .insert({
                electoral_act_id: actId,
                party_id: partyCol.siglas,
                votes: votes
              });

            if (voteError) {
              errors.push(`Row ${i + 1}: Error inserting vote for ${partyCol.siglas}: ${voteError.message}`);
            }
          }
        }

        processedMesas++;
        console.log(`✅ Processed mesa ${i}/${jsonData.length - 1}: ${mesaIdentifier}`);

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