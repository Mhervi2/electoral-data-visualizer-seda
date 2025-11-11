import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-recent-acts] Starting deletion process');

    // Create Supabase client with service role key
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error('User is not admin');
    }

    console.log('[delete-recent-acts] User verified as admin');

    // Get the 500 most recent electoral acts
    const { data: actsToDelete, error: fetchError } = await supabaseAdmin
      .from('electoral_acts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(500);

    if (fetchError) {
      console.error('[delete-recent-acts] Error fetching acts:', fetchError);
      throw fetchError;
    }

    if (!actsToDelete || actsToDelete.length === 0) {
      console.log('[delete-recent-acts] No acts found to delete');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No acts found to delete',
          deleted: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actIds = actsToDelete.map(act => act.id);
    console.log(`[delete-recent-acts] Found ${actIds.length} acts to delete`);

    // Get all acts with their image URLs to delete from storage
    const { data: actsWithImages, error: imagesError } = await supabaseAdmin
      .from('electoral_acts')
      .select('id, image_url')
      .in('id', actIds)
      .not('image_url', 'is', null);

    if (imagesError) {
      console.error('[delete-recent-acts] Error fetching images:', imagesError);
    }

    // Delete images from storage first
    if (actsWithImages && actsWithImages.length > 0) {
      const imageFilenames = actsWithImages
        .map(act => {
          if (!act.image_url) return null;
          const urlParts = act.image_url.split('/');
          return urlParts[urlParts.length - 1];
        })
        .filter(Boolean);

      if (imageFilenames.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('electoral-acts')
          .remove(imageFilenames);

        if (storageError) {
          console.error('[delete-recent-acts] Error deleting images from storage:', storageError);
        } else {
          console.log(`[delete-recent-acts] Deleted ${imageFilenames.length} images from storage`);
        }
      }
    }

    // Delete related data (to avoid foreign key constraints)
    
    // 1. Delete mail_votes
    const { error: mailVotesError } = await supabaseAdmin
      .from('mail_votes')
      .delete()
      .in('electoral_act_id', actIds);

    if (mailVotesError) {
      console.error('[delete-recent-acts] Error deleting mail_votes:', mailVotesError);
      throw mailVotesError;
    }
    console.log('[delete-recent-acts] Deleted mail_votes');

    // 2. Delete party_votes
    const { error: partyVotesError } = await supabaseAdmin
      .from('party_votes')
      .delete()
      .in('electoral_act_id', actIds);

    if (partyVotesError) {
      console.error('[delete-recent-acts] Error deleting party_votes:', partyVotesError);
      throw partyVotesError;
    }
    console.log('[delete-recent-acts] Deleted party_votes');

    // 3. Delete audit logs
    const { error: auditError } = await supabaseAdmin
      .from('electoral_acts_audit_log')
      .delete()
      .in('electoral_act_id', actIds);

    if (auditError) {
      console.error('[delete-recent-acts] Error deleting audit logs:', auditError);
      throw auditError;
    }
    console.log('[delete-recent-acts] Deleted audit logs');

    // 4. Finally, delete the electoral acts
    const { error: deleteError } = await supabaseAdmin
      .from('electoral_acts')
      .delete()
      .in('id', actIds);

    if (deleteError) {
      console.error('[delete-recent-acts] Error deleting acts:', deleteError);
      throw deleteError;
    }

    console.log(`[delete-recent-acts] Successfully deleted ${actIds.length} acts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully deleted ${actIds.length} electoral acts`,
        deleted: actIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-recent-acts] Error:', error);
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
