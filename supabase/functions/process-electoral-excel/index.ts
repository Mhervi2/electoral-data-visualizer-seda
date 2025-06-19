
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

    const headers = data[0].map(h => String(h || '').trim().toLowerCase())
    const rows = data.slice(1)

    console.log('Headers found:', headers)

    // Find required column indices
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name))
        if (index !== -1) return index
      }
      return -1
    }

    const municipioIndex = getColumnIndex(['municipio', 'municipality'])
    const mesaIndex = getColumnIndex(['mesa', 'table', 'distrito', 'seccion'])
    const censoIndex = getColumnIndex(['censo', 'census'])
    const votantesIndex = getColumnIndex(['votantes', 'voters', 'total'])
    const blancosIndex = getColumnIndex(['blancos', 'blank'])
    const nulosIndex = getColumnIndex(['nulos', 'null'])

    if (municipioIndex === -1 || mesaIndex === -1 || censoIndex === -1 || votantesIndex === -1) {
      return new Response(
        JSON.stringify({ 
          error: 'Required columns not found. Need: Municipio, Mesa, Censo, Votantes',
          foundHeaders: headers 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Find party columns (exclude known system columns)
    const systemColumns = ['municipio', 'municipality', 'mesa', 'table', 'distrito', 'seccion', 
                          'censo', 'census', 'votantes', 'voters', 'total', 'blancos', 'blank', 
                          'nulos', 'null', 'provincia', 'province', 'ca', 'comunidad']
    
    const partyIndices: { index: number; name: string; siglas: string }[] = []
    headers.forEach((header, index) => {
      if (!systemColumns.some(sys => header.includes(sys)) && header.trim()) {
        const name = header.trim()
        const siglas = name.length > 10 ? name.substring(0, 10).toUpperCase() : name.toUpperCase()
        partyIndices.push({ index, name, siglas })
      }
    })

    console.log('Party columns found:', partyIndices.map(p => p.name))

    let processedMesas = 0
    let createdParties = 0
    const errors: string[] = []

    // Get MPCA data for municipality matching
    const { data: mpcaData } = await supabaseClient
      .from('mpca')
      .select('idm, municipio, provincia, ca')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      try {
        const municipio = String(row[municipioIndex] || '').trim()
        const mesaRaw = String(row[mesaIndex] || '').trim()
        const censo = parseInt(String(row[censoIndex] || '0'))
        const votantes = parseInt(String(row[votantesIndex] || '0'))
        const blancos = blancosIndex !== -1 ? parseInt(String(row[blancosIndex] || '0')) : 0
        const nulos = nulosIndex !== -1 ? parseInt(String(row[nulosIndex] || '0')) : 0

        if (!municipio || !mesaRaw) {
          errors.push(`Row ${i + 2}: Missing municipio or mesa`)
          continue
        }

        // Find municipality in MPCA data
        const mpcaRecord = mpcaData?.find(m => 
          m.municipio.toLowerCase().trim() === municipio.toLowerCase().trim()
        )

        if (!mpcaRecord) {
          errors.push(`Row ${i + 2}: Municipality "${municipio}" not found in MPCA data`)
          continue
        }

        // Parse mesa identifier (could be "1-001-A" or just "A" etc)
        let mesaIdentifier = mesaRaw
        if (!mesaRaw.includes('-')) {
          // If it's just a letter, we need to construct the full identifier
          // For now, we'll assume default values. In real implementation, 
          // you might need additional columns for distrito/seccion
          mesaIdentifier = `1-001-${mesaRaw}`
        }

        // Check if electoral act already exists
        const { data: existingAct } = await supabaseClient
          .from('electoral_acts')
          .select('id')
          .eq('municipality_idm', mpcaRecord.idm)
          .eq('mesa_identifier', mesaIdentifier)
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
              mesa_identifier: mesaIdentifier,
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
        }

        // Process party votes
        for (const party of partyIndices) {
          const votes = parseInt(String(row[party.index] || '0'))
          if (votes === 0) continue

          // Create or get party
          const { data: existingParty } = await supabaseClient
            .from('political_parties')
            .select('id')
            .eq('siglas', party.siglas)
            .single()

          let partyId: string

          if (existingParty) {
            partyId = existingParty.id
          } else {
            const { data: newParty, error: partyError } = await supabaseClient
              .from('political_parties')
              .insert({
                id: party.siglas,
                name: party.name,
                siglas: party.siglas,
                color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
              })
              .select('id')
              .single()

            if (partyError) throw partyError
            partyId = newParty.id
            createdParties++
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
