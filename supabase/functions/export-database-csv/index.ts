import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRow {
  [key: string]: any
}

// Convert array of objects to CSV string
function arrayToCSV(data: ExportRow[], tableName: string): string {
  if (!data || data.length === 0) return `# ${tableName} - No data\n`
  
  const headers = Object.keys(data[0])
  const csvRows = [
    `# ${tableName} Export - ${new Date().toISOString()}`,
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value.toString()
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

// Create a simple ZIP-like format (just concatenated files with headers)
function createArchive(files: { name: string; content: string }[]): string {
  let archive = `# Database Export Archive - ${new Date().toISOString()}\n`
  archive += `# Files included: ${files.length}\n`
  archive += `# ================================================\n\n`
  
  files.forEach(file => {
    archive += `\n# FILE: ${file.name}\n`
    archive += `# ================================================\n`
    archive += file.content
    archive += `\n# END OF FILE: ${file.name}\n`
    archive += `# ================================================\n\n`
  })
  
  return archive
}

// Calculate simple checksum
function calculateChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user info
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${user.email} initiated database export`)

    // Get client IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Define tables to export
    const tablesToExport = [
      'electoral_acts',
      'party_votes', 
      'mail_votes',
      'political_parties',
      'elections',
      'profiles',
      'mpca',
      'electoral_acts_audit_log',
      'provincial_seats',
      'political_party_provincial_order',
      'election_parties',
      'data_export_logs'
    ]

    const files: { name: string; content: string }[] = []
    let totalSize = 0

    // Export each table
    for (const table of tablesToExport) {
      try {
        console.log(`Exporting table: ${table}`)
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false, nullsFirst: false })

        if (error) {
          console.error(`Error exporting ${table}:`, error)
          continue
        }

        const csvContent = arrayToCSV(data || [], table)
        files.push({
          name: `${table}.csv`,
          content: csvContent
        })
        
        totalSize += csvContent.length
        console.log(`Exported ${data?.length || 0} rows from ${table}`)
      } catch (err) {
        console.error(`Failed to export ${table}:`, err)
        files.push({
          name: `${table}_ERROR.txt`,
          content: `Error exporting ${table}: ${err.message}`
        })
      }
    }

    // Create metadata file
    const metadata = {
      export_date: new Date().toISOString(),
      exported_by: user.email,
      tables_included: tablesToExport,
      total_files: files.length,
      total_size_bytes: totalSize,
      system_info: {
        ip_address: ip,
        user_agent: userAgent
      }
    }

    files.push({
      name: 'export_metadata.json',
      content: JSON.stringify(metadata, null, 2)
    })

    // Create the archive
    const archiveContent = createArchive(files)
    const checksum = calculateChecksum(archiveContent)

    // Log the export
    try {
      await supabase
        .from('data_export_logs')
        .insert({
          user_id: user.id,
          file_size: archiveContent.length,
          tables_included: tablesToExport,
          ip_address: ip,
          user_agent: userAgent,
          success: true,
          file_checksum: checksum
        })
    } catch (logError) {
      console.error('Failed to log export:', logError)
    }

    console.log(`Export completed successfully. Archive size: ${archiveContent.length} bytes, Checksum: ${checksum}`)

    // Return the file
    return new Response(archiveContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="database_export_${new Date().toISOString().split('T')[0]}.txt"`,
        'Content-Length': archiveContent.length.toString(),
        'X-Export-Checksum': checksum
      }
    })

  } catch (error) {
    console.error('Export failed:', error)
    
    // Try to log the failed export
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        
        if (user) {
          await supabase
            .from('data_export_logs')
            .insert({
              user_id: user.id,
              tables_included: [],
              success: false,
              error_message: error.message
            })
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})