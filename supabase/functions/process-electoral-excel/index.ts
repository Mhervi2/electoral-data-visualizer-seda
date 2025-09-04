
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const sourceType = formData.get('sourceType') as string
    const electionId = formData.get('electionId') as string
    
    if (!file || !sourceType || !electionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Processing file:', file.name, 'Source:', sourceType)

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Excel file must have at least 2 rows (header + data)' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const headers = data[0].map(h => String(h || '').trim())
    const rows = data.slice(1)

    console.log('Headers found:', headers)

    // New format: 
    // Column A: Full mesa identifier (e.g., "08-05-001-01-001-U")
    // Column B: Municipality name (for reference only)
    // Column C: Census
    // Column D: Total Voters  
    // Column E: Null Votes
    // Column F: Blank Votes
    // Column G+: Party identifier numbers (1, 2, 3, etc.)

    const fullIdentifierIndex = 0; // Column A
    const municipioRefIndex = 1;   // Column B (reference only)
    const censoIndex = 2;          // Column C
    const votantesIndex = 3;       // Column D  
    const nulosIndex = 4;          // Column E
    const blancosIndex = 5;        // Column F

    if (headers.length < 6) {
      return new Response(
        JSON.stringify({ 
          error: 'Excel file must have at least 6 columns: Full Identifier, Municipality, Census, Voters, Null Votes, Blank Votes',
          foundHeaders: headers 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Find party columns starting from column G (index 6)
    // These should be party_identifier numbers (1, 2, 3, etc.)
    const partyIdentifierIndices: { index: number; partyIdentifier: number }[] = []
    for (let i = 6; i < headers.length; i++) {
      const header = headers[i]?.toString().trim()
      if (header && /^\d+$/.test(header)) {
        const partyIdentifier = parseInt(header)
        partyIdentifierIndices.push({ index: i, partyIdentifier })
      }
    }

    console.log('Party identifier columns found:', partyIdentifierIndices)

    console.log('Party columns found:', partyIdentifierIndices.map(p => p.partyIdentifier))

    let processedMesas = 0
    let createdMesas = 0
    let updatedMesas = 0
    let createdParties = 0
    const errors: string[] = []

    // Get MPCA data and political parties for matching
    const { data: mpcaData } = await supabaseClient
      .from('mpca')
      .select('idm, municipio, provincia, ca, idp, idca, idc')

    const { data: partiesData } = await supabaseClient
      .from('political_parties')
      .select('id, party_identifier')

    // Create lookup map for parties by identifier
    const partyByIdentifierMap = new Map<number, string>()
    partiesData?.forEach(party => {
      partyByIdentifierMap.set(party.party_identifier, party.id)
    })

    // Utility function to parse full mesa identifier
    const parseFullMesaIdentifier = (fullIdentifier: string | null | undefined) => {
      if (!fullIdentifier) return { isValid: false }
      
      const parts = fullIdentifier.trim().split('-')
      if (parts.length !== 6) return { isValid: false }
      
      const [idca, idp, idc, distrito, seccion, mesa] = parts
      return {
        isValid: true,
        idca: parseInt(idca),
        idp: parseInt(idp), 
        idc,
        distrito,
        seccion,
        mesa,
        shortIdentifier: `${distrito}-${seccion}-${mesa}`
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      try {
        const fullIdentifier = String(row[fullIdentifierIndex] || '').trim()
        const municipioRef = String(row[municipioRefIndex] || '').trim()
        const censo = parseInt(String(row[censoIndex] || '0'))
        const votantes = parseInt(String(row[votantesIndex] || '0'))
        const nulos = parseInt(String(row[nulosIndex] || '0'))
        const blancos = parseInt(String(row[blancosIndex] || '0'))

        if (!fullIdentifier) {
          errors.push(`Row ${i + 2}: Missing full mesa identifier`)
          continue
        }

        // Parse and validate full identifier
        const parsed = parseFullMesaIdentifier(fullIdentifier)
        if (!parsed.isValid) {
          errors.push(`Row ${i + 2}: Invalid full identifier format: "${fullIdentifier}"`)
          continue
        }

        // Find municipality by territorial codes from parsed identifier
        const mpcaRecord = mpcaData?.find(m => 
          m.idca === parsed.idca && 
          m.idp === parsed.idp && 
          m.idc === parsed.idc
        )

        if (!mpcaRecord) {
          errors.push(`Row ${i + 2}: Municipality not found for identifier codes ${parsed.idca}-${parsed.idp}-${parsed.idc}`)
          continue
        }

        // Check if electoral act already exists by full identifier
        const { data: existingAct } = await supabaseClient
          .from('electoral_acts')
          .select('id')
          .eq('full_identifier', fullIdentifier)
          .eq('source_type', sourceType)
          .single()

        let actId: string

        if (existingAct) {
          // Update existing act
          const { data: updatedAct, error: updateError } = await supabaseClient
            .from('electoral_acts')
            .update({
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos
            })
            .eq('id', existingAct.id)
            .select('id')
            .single()

          if (updateError) throw updateError
          actId = updatedAct.id
          updatedMesas++
          console.log(`🔄 Updated existing mesa: ${fullIdentifier}`)

          // Delete existing party votes
          await supabaseClient
            .from('party_votes')
            .delete()
            .eq('electoral_act_id', actId)

        } else {
          // Create new electoral act
          const { data: newAct, error: insertError } = await supabaseClient
            .from('electoral_acts')
            .insert({
              election_id: electionId,
              municipality_idm: mpcaRecord.idm,
              mesa_identifier: parsed.shortIdentifier,
              full_identifier: fullIdentifier,
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType
            })
            .select('id')
            .single()

          if (insertError) throw insertError
          actId = newAct.id
          createdMesas++
          console.log(`✅ Created new mesa: ${fullIdentifier}`)
        }

        // Process party votes using party_identifier
        for (const partyColumn of partyIdentifierIndices) {
          const votes = parseInt(String(row[partyColumn.index] || '0'))
          if (votes === 0) continue

          // Get party ID by party_identifier
          const partyId = partyByIdentifierMap.get(partyColumn.partyIdentifier)
          
          if (!partyId) {
            errors.push(`Row ${i + 2}: Party with identifier ${partyColumn.partyIdentifier} not found`)
            continue
          }

          // Insert party votes
          await supabaseClient
            .from('party_votes')
            .insert({
              electoral_act_id: actId,
              party_id: partyId,
              votes: votes
            })
        }

        processedMesas++

      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`)
        console.error(`Error processing row ${i + 2}:`, error)
      }
    }

    const result = {
      success: true,
      processedMesas,
      createdMesas,
      updatedMesas,
      createdParties,
      totalRows: rows.length,
      errors: errors.slice(0, 10), // Limit errors shown
      hasMoreErrors: errors.length > 10
    }

    console.log('Processing completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
