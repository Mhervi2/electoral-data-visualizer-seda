
import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

export const useBiometric = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSupport = useCallback(async () => {
    try {
      // Verificar soporte básico de WebAuthn
      if (!window.PublicKeyCredential) {
        console.log('WebAuthn no está disponible');
        setIsSupported(false);
        return false;
      }

      // Verificar soporte de autenticador de plataforma
      const platformSupported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('Soporte de autenticador de plataforma:', platformSupported);
      
      // En móviles, también verificar si hay métodos de verificación disponibles
      const conditionalSupported = window.PublicKeyCredential.isConditionalMediationAvailable 
        ? await window.PublicKeyCredential.isConditionalMediationAvailable()
        : true;
      
      console.log('Soporte condicional:', conditionalSupported);
      
      const supported = platformSupported || conditionalSupported;
      setIsSupported(supported);
      return supported;
    } catch (error) {
      console.error('Error verificando soporte biométrico:', error);
      setIsSupported(false);
      return false;
    }
  }, []);

  // Verificar soporte al cargar el hook
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  const registerBiometric = useCallback(async (email: string, deviceName?: string) => {
    setIsLoading(true);
    try {
      console.log('Iniciando registro biométrico para:', email);
      
      // Verificar soporte antes de proceder
      const supported = await checkSupport();
      if (!supported) {
        throw new Error('Tu dispositivo no es compatible con autenticación biométrica');
      }

      // Solicitar opciones de registro
      console.log('Solicitando opciones de registro...');
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('webauthn', {
        body: { action: 'register-start', email }
      });

      if (optionsError) {
        console.error('Error obteniendo opciones:', optionsError);
        throw new Error('Error obteniendo opciones de registro: ' + (optionsError.message || 'Error desconocido'));
      }

      if (!optionsData?.options) {
        throw new Error('No se recibieron opciones de registro válidas');
      }

      console.log('Opciones de registro recibidas, iniciando registro...');

      // Iniciar registro con timeout extendido para móviles
      const registrationResponse = await startRegistration(optionsData.options);
      
      console.log('Registro completado, verificando...');

      // Completar registro
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('webauthn', {
        body: {
          action: 'register-complete',
          email,
          registrationData: {
            ...registrationResponse,
            challenge: optionsData.options.challenge,
            deviceName: deviceName || 'Dispositivo móvil'
          }
        }
      });

      if (verificationError) {
        console.error('Error en verificación:', verificationError);
        throw new Error('Error verificando el registro: ' + (verificationError.message || 'Error desconocido'));
      }

      if (!verificationData?.verified) {
        throw new Error('El registro biométrico no pudo ser verificado');
      }

      console.log('Registro biométrico completado exitosamente');
      return { success: true };
      
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          errorMessage = 'Tu dispositivo no es compatible con autenticación biométrica';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Error de seguridad. Verifica que estés usando HTTPS';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Registro cancelado o no autorizado';
        } else if (error.name === 'InvalidStateError') {
          errorMessage = 'Ya existe una credencial para este dispositivo';
        } else if (error.name === 'NetworkError') {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [checkSupport]);

  const authenticateBiometric = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      console.log('Iniciando autenticación biométrica para:', email);
      
      // Verificar soporte antes de proceder
      const supported = await checkSupport();
      if (!supported) {
        throw new Error('Tu dispositivo no es compatible con autenticación biométrica');
      }

      // Solicitar opciones de autenticación
      console.log('Solicitando opciones de autenticación...');
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('webauthn', {
        body: { action: 'auth-start', email }
      });

      if (optionsError) {
        console.error('Error obteniendo opciones de autenticación:', optionsError);
        throw new Error('Error obteniendo opciones de autenticación: ' + (optionsError.message || 'Error desconocido'));
      }

      if (!optionsData?.options) {
        throw new Error('No se recibieron opciones de autenticación válidas');
      }

      console.log('Opciones de autenticación recibidas, iniciando autenticación...');

      // Iniciar autenticación
      const authResponse = await startAuthentication(optionsData.options);
      
      console.log('Autenticación completada, verificando...');

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

      if (verificationError) {
        console.error('Error en verificación de autenticación:', verificationError);
        throw new Error('Error verificando la autenticación: ' + (verificationError.message || 'Error desconocido'));
      }

      if (!verificationData?.verified) {
        throw new Error('La autenticación biométrica no pudo ser verificada');
      }

      console.log('Autenticación biométrica completada exitosamente');
      return { success: true };
      
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error de autenticación';
      
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          errorMessage = 'Tu dispositivo no es compatible con autenticación biométrica';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'Error de seguridad. Verifica que estés usando HTTPS';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Autenticación cancelada o no autorizada';
        } else if (error.name === 'NetworkError') {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [checkSupport]);

  const getBiometricCredentials = useCallback(async (email: string) => {
    try {
      console.log('Obteniendo credenciales biométricas para:', email);
      
      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('id, device_name, created_at, last_used_at')
        .eq('user_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo credenciales:', error);
        throw error;
      }

      console.log(`Encontradas ${data?.length || 0} credenciales`);
      return data || [];
    } catch (error) {
      console.error('Error obteniendo credenciales biométricas:', error);
      return [];
    }
  }, []);

  const removeBiometricCredential = useCallback(async (credentialId: string) => {
    try {
      console.log('Eliminando credencial:', credentialId);
      
      const { error } = await supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) {
        console.error('Error eliminando credencial:', error);
        throw error;
      }

      console.log('Credencial eliminada exitosamente');
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
