
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from 'https://esm.sh/@simplewebauthn/server@8'

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

    const { action, email, registrationData, authenticationData } = await req.json()

    if (action === 'register-start') {
      // Generar opciones para el registro
      const options = await generateRegistrationOptions({
        rpName: 'SEDA Electoral',
        rpID: new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname,
        userID: email,
        userName: email,
        userDisplayName: email,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'discouraged',
          userVerification: 'preferred',
        },
      })

      return new Response(
        JSON.stringify({ options }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'register-complete') {
      // Verificar y guardar la credencial
      const verification = await verifyRegistrationResponse({
        response: registrationData,
        expectedChallenge: registrationData.challenge,
        expectedOrigin: req.headers.get('origin') ?? '',
        expectedRPID: new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname,
      })

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

        await supabaseClient
          .from('biometric_credentials')
          .insert({
            user_email: email,
            credential_id: Buffer.from(credentialID).toString('base64'),
            public_key: Buffer.from(credentialPublicKey).toString('base64'),
            counter: counter,
            device_name: registrationData.deviceName || 'Dispositivo desconocido'
          })

        return new Response(
          JSON.stringify({ verified: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ verified: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'auth-start') {
      // Obtener credenciales del usuario
      const { data: credentials } = await supabaseClient
        .from('biometric_credentials')
        .select('credential_id')
        .eq('user_email', email)

      const allowCredentials = credentials?.map(cred => ({
        id: new Uint8Array(Buffer.from(cred.credential_id, 'base64')),
        type: 'public-key' as const,
      })) || []

      const options = await generateAuthenticationOptions({
        rpID: new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname,
        allowCredentials,
        userVerification: 'preferred',
      })

      return new Response(
        JSON.stringify({ options }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'auth-complete') {
      // Verificar la autenticación
      const { data: credentials } = await supabaseClient
        .from('biometric_credentials')
        .select('*')
        .eq('user_email', email)

      const credentialId = Buffer.from(authenticationData.id, 'base64url').toString('base64')
      const credential = credentials?.find(c => c.credential_id === credentialId)

      if (!credential) {
        return new Response(
          JSON.stringify({ verified: false, error: 'Credencial no encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const verification = await verifyAuthenticationResponse({
        response: authenticationData,
        expectedChallenge: authenticationData.challenge,
        expectedOrigin: req.headers.get('origin') ?? '',
        expectedRPID: new URL(Deno.env.get('SUPABASE_URL') ?? '').hostname,
        authenticator: {
          credentialID: new Uint8Array(Buffer.from(credential.credential_id, 'base64')),
          credentialPublicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64')),
          counter: credential.counter,
        },
      })

      if (verification.verified) {
        // Actualizar contador y última vez usado
        await supabaseClient
          .from('biometric_credentials')
          .update({
            counter: verification.authenticationInfo?.newCounter || credential.counter,
            last_used_at: new Date().toISOString()
          })
          .eq('id', credential.id)

        return new Response(
          JSON.stringify({ verified: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ verified: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en webauthn:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
