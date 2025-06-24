
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    console.log(`Processing ${req.method} request`)
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, registrationData, authenticationData } = await req.json()
    console.log(`Action: ${action}, Email: ${email}`)

    const origin = req.headers.get('origin') ?? ''
    const rpID = new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname
    
    console.log(`Origin: ${origin}, RPID: ${rpID}`)

    if (action === 'register-start') {
      console.log('Generating registration options')
      
      // Generar opciones para el registro optimizadas para móviles
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
      
      try {
        // Verificar y guardar la credencial
        const verification = await verifyRegistrationResponse({
          response: registrationData,
          expectedChallenge: registrationData.challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          requireUserVerification: false, // Más flexible para móviles
        })

        console.log(`Verification result: ${verification.verified}`)

        if (verification.verified && verification.registrationInfo) {
          const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

          // Convertir credentialID a base64 usando TextDecoder
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
            throw insertError
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
          JSON.stringify({ verified: false, error: 'Error en la verificación del registro' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (action === 'auth-start') {
      console.log('Generating authentication options')
      
      // Obtener credenciales del usuario
      const { data: credentials, error: fetchError } = await supabaseClient
        .from('biometric_credentials')
        .select('credential_id')
        .eq('user_email', email)

      if (fetchError) {
        console.error('Error fetching credentials:', fetchError)
        throw fetchError
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
        timeout: 120000, // 2 minutos para móviles
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
      
      // Obtener credenciales del usuario
      const { data: credentials, error: fetchError } = await supabaseClient
        .from('biometric_credentials')
        .select('*')
        .eq('user_email', email)

      if (fetchError) {
        console.error('Error fetching credentials:', fetchError)
        throw fetchError
      }

      // Buscar la credencial correspondiente
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
          requireUserVerification: false, // Más flexible para móviles
        })

        console.log(`Authentication verification result: ${verification.verified}`)

        if (verification.verified) {
          // Actualizar contador y última vez usado
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
          JSON.stringify({ verified: false, error: 'Error en la verificación de autenticación' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`Invalid action: ${action}`)
    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webauthn function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
