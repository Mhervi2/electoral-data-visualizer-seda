
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from 'https://esm.sh/@simplewebauthn/server@7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests FIRST, before any other processing
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  // Only process non-OPTIONS requests
  if (req.method !== 'POST') {
    console.log(`Method ${req.method} not allowed`)
    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  let requestBody;
  try {
    console.log(`Processing ${req.method} request`)
    
    // Parse JSON body safely
    const bodyText = await req.text()
    if (!bodyText) {
      throw new Error('Request body is empty')
    }
    
    requestBody = JSON.parse(bodyText)
    console.log(`Request body parsed successfully for action: ${requestBody.action}`)
    
  } catch (bodyError) {
    console.error('Error parsing request body:', bodyError)
    return new Response(
      JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: bodyError instanceof Error ? bodyError.message : 'Unknown error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, registrationData, authenticationData } = requestBody
    
    if (!action || !email) {
      return new Response(
        JSON.stringify({ error: 'Action and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Action: ${action}, Email: ${email}`)

    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''
    const rpID = new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname
    
    console.log(`Origin: ${origin}, RPID: ${rpID}`)

    if (action === 'register-start') {
      console.log('Generating registration options')
      
      const options = await generateRegistrationOptions({
        rpName: 'SEDA Electoral',
        rpID: rpID,
        userID: new TextEncoder().encode(email),
        userName: email,
        userDisplayName: email,
        timeout: 120000, // 2 minutos para dispositivos móviles
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'discouraged',
        },
        supportedAlgorithmIDs: [-7, -257], // ES256 y RS256
      })

      console.log('Registration options generated successfully')
      
      return new Response(
        JSON.stringify({ options }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'register-complete') {
      console.log('Verifying registration response')
      
      if (!registrationData) {
        return new Response(
          JSON.stringify({ verified: false, error: 'Registration data is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      try {
        const verification = await verifyRegistrationResponse({
          response: registrationData,
          expectedChallenge: registrationData.challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          requireUserVerification: false,
        })

        console.log(`Verification result: ${verification.verified}`)

        if (verification.verified && verification.registrationInfo) {
          const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

          const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialID)))
          const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialPublicKey)))

          console.log('Saving credential to database')

          const { error: insertError } = await supabaseClient
            .from('biometric_credentials')
            .insert({
              user_email: email,
              credential_id: credentialIdBase64,
              public_key: publicKeyBase64,
              counter: counter,
              device_name: registrationData.deviceName || 'Dispositivo móvil'
            })

          if (insertError) {
            console.error('Database insert error:', insertError)
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
            )
          }

          console.log('Credential saved successfully')

          return new Response(
            JSON.stringify({ verified: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Verification failed')
        return new Response(
          JSON.stringify({ verified: false, error: 'Verificación fallida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (verifyError) {
        console.error('Registration verification error:', verifyError)
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
        )
      }
    }

    if (action === 'auth-start') {
      console.log('Generating authentication options')
      
      const { data: credentials, error: fetchError } = await supabaseClient
        .from('biometric_credentials')
        .select('credential_id')
        .eq('user_email', email)

      if (fetchError) {
        console.error('Error fetching credentials:', fetchError)
        return new Response(
          JSON.stringify({ 
            error: 'Error fetching credentials',
            details: fetchError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Found ${credentials?.length || 0} credentials`)

      const allowCredentials = credentials?.map(cred => {
        const credentialId = Uint8Array.from(atob(cred.credential_id), c => c.charCodeAt(0))
        return {
          id: credentialId,
          type: 'public-key' as const,
        }
      }) || []

      const options = await generateAuthenticationOptions({
        timeout: 120000,
        rpID: rpID,
        allowCredentials,
        userVerification: 'preferred',
      })

      console.log('Authentication options generated successfully')

      return new Response(
        JSON.stringify({ options }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'auth-complete') {
      console.log('Verifying authentication response')
      
      if (!authenticationData) {
        return new Response(
          JSON.stringify({ verified: false, error: 'Authentication data is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      const { data: credentials, error: fetchError } = await supabaseClient
        .from('biometric_credentials')
        .select('*')
        .eq('user_email', email)

      if (fetchError) {
        console.error('Error fetching credentials:', fetchError)
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
        )
      }

      const credentialIdBuffer = Uint8Array.from(atob(authenticationData.id), c => c.charCodeAt(0))
      const credentialIdBase64 = btoa(String.fromCharCode(...credentialIdBuffer))
      
      console.log(`Looking for credential: ${credentialIdBase64}`)
      
      const credential = credentials?.find(c => c.credential_id === credentialIdBase64)

      if (!credential) {
        console.log('Credential not found')
        return new Response(
          JSON.stringify({ verified: false, error: 'Credencial no encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Credential found, verifying authentication')

      try {
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
          requireUserVerification: false,
        })

        console.log(`Authentication verification result: ${verification.verified}`)

        if (verification.verified) {
          await supabaseClient
            .from('biometric_credentials')
            .update({
              counter: verification.authenticationInfo?.newCounter || credential.counter,
              last_used_at: new Date().toISOString()
            })
            .eq('id', credential.id)

          console.log('Authentication successful')

          return new Response(
            JSON.stringify({ verified: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Authentication verification failed')
        return new Response(
          JSON.stringify({ verified: false, error: 'Verificación de autenticación fallida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (authError) {
        console.error('Authentication verification error:', authError)
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
        )
      }
    }

    console.log(`Invalid action: ${action}`)
    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webauthn function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
