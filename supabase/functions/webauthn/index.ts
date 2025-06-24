
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import SimpleWebAuthn functions with explicit version for better Deno compatibility
const { generateRegistrationOptions, verifyRegistrationResponse } = await import('https://esm.sh/@simplewebauthn/server@9.0.3/deno/main.ts');
const { generateAuthenticationOptions, verifyAuthenticationResponse } = await import('https://esm.sh/@simplewebauthn/server@9.0.3/deno/main.ts');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Global error handler wrapper
const handleRequest = async (req: Request): Promise<Response> => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} request received`);
    
    // Handle CORS preflight requests FIRST - critical for mobile devices
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`Method ${req.method} not allowed`);
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body safely
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText.trim()) {
        throw new Error('Request body is empty');
      }
      requestBody = JSON.parse(bodyText);
      console.log(`Action requested: ${requestBody.action}`);
    } catch (bodyError) {
      console.error('Error parsing request body:', bodyError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: bodyError instanceof Error ? bodyError.message : 'Unknown error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const { action, email, registrationData, authenticationData } = requestBody;
    
    // Validate required fields
    if (!action || !email) {
      return new Response(
        JSON.stringify({ error: 'Action and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get origin and RP ID - optimized for mobile devices
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const rpID = new URL(supabaseUrl).hostname;
    
    console.log(`Origin: ${origin}, RPID: ${rpID}`);

    switch (action) {
      case 'register-start':
        return await handleRegisterStart(email, rpID);
      
      case 'register-complete':
        return await handleRegisterComplete(email, registrationData, origin, rpID, supabaseClient);
      
      case 'auth-start':
        return await handleAuthStart(email, rpID, supabaseClient);
      
      case 'auth-complete':
        return await handleAuthComplete(email, authenticationData, origin, rpID, supabaseClient);
      
      default:
        console.log(`Invalid action: ${action}`);
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Global error handler:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Handle registration start - optimized for mobile devices
const handleRegisterStart = async (email: string, rpID: string): Promise<Response> => {
  try {
    console.log('Generating registration options for mobile device');
    
    const options = await generateRegistrationOptions({
      rpName: 'SEDA Electoral',
      rpID: rpID,
      userID: new TextEncoder().encode(email),
      userName: email,
      userDisplayName: email,
      timeout: 180000, // 3 minutes for mobile devices - increased timeout
      attestationType: 'none',
      authenticatorSelection: {
        // Optimized for mobile devices - prefer platform authenticators (TouchID, FaceID, etc.)
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'discouraged',
      },
      // Support for common mobile algorithms
      supportedAlgorithmIDs: [-7, -257, -35, -36], // ES256, RS256, ES384, ES512
    });

    console.log('Registration options generated successfully for mobile');
    
    return new Response(
      JSON.stringify({ options }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating registration options:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error generating registration options',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Handle registration completion
const handleRegisterComplete = async (
  email: string, 
  registrationData: any, 
  origin: string, 
  rpID: string, 
  supabaseClient: any
): Promise<Response> => {
  try {
    console.log('Verifying registration response for mobile device');
    
    if (!registrationData) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Registration data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const verification = await verifyRegistrationResponse({
      response: registrationData,
      expectedChallenge: registrationData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false, // More flexible for mobile devices
    });

    console.log(`Mobile registration verification result: ${verification.verified}`);

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Convert to base64 for storage
      const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialID)));
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialPublicKey)));

      console.log('Saving mobile credential to database');

      const { error: insertError } = await supabaseClient
        .from('biometric_credentials')
        .insert({
          user_email: email,
          credential_id: credentialIdBase64,
          public_key: publicKeyBase64,
          counter: counter,
          device_name: registrationData.deviceName || `Dispositivo móvil ${new Date().toLocaleDateString()}`
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: 'Error saving credential to database',
            details: insertError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Mobile credential saved successfully');

      return new Response(
        JSON.stringify({ verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mobile registration verification failed');
    return new Response(
      JSON.stringify({ verified: false, error: 'Verificación fallida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (verifyError) {
    console.error('Registration verification error:', verifyError);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: 'Error en la verificación del registro',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Handle authentication start
const handleAuthStart = async (email: string, rpID: string, supabaseClient: any): Promise<Response> => {
  try {
    console.log('Generating authentication options for mobile device');
    
    const { data: credentials, error: fetchError } = await supabaseClient
      .from('biometric_credentials')
      .select('credential_id')
      .eq('user_email', email);

    if (fetchError) {
      console.error('Error fetching credentials:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching credentials',
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${credentials?.length || 0} credentials for mobile auth`);

    const allowCredentials = credentials?.map((cred: any) => {
      const credentialId = Uint8Array.from(atob(cred.credential_id), c => c.charCodeAt(0));
      return {
        id: credentialId,
        type: 'public-key' as const,
      };
    }) || [];

    const options = await generateAuthenticationOptions({
      timeout: 180000, // 3 minutes for mobile devices
      rpID: rpID,
      allowCredentials,
      userVerification: 'preferred', // More flexible for mobile
    });

    console.log('Mobile authentication options generated successfully');

    return new Response(
      JSON.stringify({ options }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error generating authentication options',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Handle authentication completion
const handleAuthComplete = async (
  email: string,
  authenticationData: any,
  origin: string,
  rpID: string,
  supabaseClient: any
): Promise<Response> => {
  try {
    console.log('Verifying mobile authentication response');
    
    if (!authenticationData) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Authentication data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { data: credentials, error: fetchError } = await supabaseClient
      .from('biometric_credentials')
      .select('*')
      .eq('user_email', email);

    if (fetchError) {
      console.error('Error fetching credentials for auth:', fetchError);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Error fetching credentials',
          details: fetchError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const credentialIdBuffer = Uint8Array.from(atob(authenticationData.id), c => c.charCodeAt(0));
    const credentialIdBase64 = btoa(String.fromCharCode(...credentialIdBuffer));
    
    console.log(`Looking for mobile credential: ${credentialIdBase64.substring(0, 20)}...`);
    
    const credential = credentials?.find((c: any) => c.credential_id === credentialIdBase64);

    if (!credential) {
      console.log('Mobile credential not found');
      return new Response(
        JSON.stringify({ verified: false, error: 'Credencial no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mobile credential found, verifying authentication');

    const verification = await verifyAuthenticationResponse({
      response: authenticationData,
      expectedChallenge: authenticationData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Uint8Array.from(atob(credential.credential_id), c => c.charCodeAt(0)),
        credentialPublicKey: Uint8Array.from(atob(credential.public_key), c => c.charCodeAt(0)),
        counter: credential.counter,
      },
      requireUserVerification: false, // More flexible for mobile devices
    });

    console.log(`Mobile authentication verification result: ${verification.verified}`);

    if (verification.verified) {
      // Update counter and last used timestamp
      await supabaseClient
        .from('biometric_credentials')
        .update({
          counter: verification.authenticationInfo?.newCounter || credential.counter,
          last_used_at: new Date().toISOString()
        })
        .eq('id', credential.id);

      console.log('Mobile authentication successful');

      return new Response(
        JSON.stringify({ verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mobile authentication verification failed');
    return new Response(
      JSON.stringify({ verified: false, error: 'Verificación de autenticación fallida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (authError) {
    console.error('Mobile authentication verification error:', authError);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: 'Error en la verificación de autenticación',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Serve the function with global error handling
serve(handleRequest);
