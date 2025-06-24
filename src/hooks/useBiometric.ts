
import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

export const useBiometric = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSupport = useCallback(async () => {
    try {
      const supported = await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(!!supported);
      return !!supported;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsSupported(false);
      return false;
    }
  }, []);

  const registerBiometric = useCallback(async (email: string, deviceName?: string) => {
    setIsLoading(true);
    try {
      // Solicitar opciones de registro
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('webauthn', {
        body: { action: 'register-start', email }
      });

      if (optionsError) {
        throw new Error('Error obteniendo opciones de registro');
      }

      // Iniciar registro
      const registrationResponse = await startRegistration(optionsData.options);

      // Completar registro
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('webauthn', {
        body: {
          action: 'register-complete',
          email,
          registrationData: {
            ...registrationResponse,
            challenge: optionsData.options.challenge,
            deviceName: deviceName || 'Dispositivo desconocido'
          }
        }
      });

      if (verificationError || !verificationData.verified) {
        throw new Error('Error verificando el registro biométrico');
      }

      return { success: true };
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateBiometric = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      // Solicitar opciones de autenticación
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('webauthn', {
        body: { action: 'auth-start', email }
      });

      if (optionsError) {
        throw new Error('Error obteniendo opciones de autenticación');
      }

      // Iniciar autenticación
      const authResponse = await startAuthentication(optionsData.options);

      // Completar autenticación
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('webauthn', {
        body: {
          action: 'auth-complete',
          email,
          authenticationData: {
            ...authResponse,
            challenge: optionsData.options.challenge
          }
        }
      });

      if (verificationError || !verificationData.verified) {
        throw new Error('Error verificando la autenticación biométrica');
      }

      return { success: true };
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error de autenticación' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBiometricCredentials = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('id, device_name, created_at, last_used_at')
        .eq('user_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo credenciales biométricas:', error);
      return [];
    }
  }, []);

  const removeBiometricCredential = useCallback(async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando credencial biométrica:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }, []);

  return {
    isSupported,
    isLoading,
    checkSupport,
    registerBiometric,
    authenticateBiometric,
    getBiometricCredentials,
    removeBiometricCredential,
  };
};
