import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[clean-orphaned-images] Starting cleanup process');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error('User is not admin');
    }

    console.log('[clean-orphaned-images] User verified as admin');

    // Get all files from the electoral-acts bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('electoral-acts')
      .list();

    if (listError) {
      console.error('[clean-orphaned-images] Error listing files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('[clean-orphaned-images] No files found in storage');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No files found in storage',
          deleted: 0,
          checked: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[clean-orphaned-images] Found ${files.length} files in storage`);

    // Get all image URLs from electoral_acts
    const { data: acts, error: actsError } = await supabaseAdmin
      .from('electoral_acts')
      .select('image_url')
      .not('image_url', 'is', null);

    if (actsError) {
      console.error('[clean-orphaned-images] Error fetching acts:', actsError);
      throw actsError;
    }

    // Extract filenames from URLs
    const validFilenames = new Set(
      acts?.map(act => {
        if (!act.image_url) return null;
        const urlParts = act.image_url.split('/');
        return urlParts[urlParts.length - 1];
      }).filter(Boolean) || []
    );

    console.log(`[clean-orphaned-images] Found ${validFilenames.size} valid image references in database`);

    // Find orphaned files
    const orphanedFiles = files.filter(file => !validFilenames.has(file.name));

    if (orphanedFiles.length === 0) {
      console.log('[clean-orphaned-images] No orphaned files found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orphaned files found',
          deleted: 0,
          checked: files.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[clean-orphaned-images] Found ${orphanedFiles.length} orphaned files`);

    // Delete orphaned files
    const filesToDelete = orphanedFiles.map(file => file.name);
    const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
      .from('electoral-acts')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('[clean-orphaned-images] Error deleting files:', deleteError);
      throw deleteError;
    }

    console.log(`[clean-orphaned-images] Successfully deleted ${orphanedFiles.length} orphaned files`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully deleted ${orphanedFiles.length} orphaned images`,
        deleted: orphanedFiles.length,
        checked: files.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[clean-orphaned-images] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
