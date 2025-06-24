
import React from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BiometricLoginButtonProps {
  email: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const BiometricLoginButton = ({ email, onSuccess, onError }: BiometricLoginButtonProps) => {
  const { loginWithBiometric, biometric } = useAuth();

  const handleBiometricLogin = async () => {
    try {
      const success = await loginWithBiometric(email);
      if (success) {
        onSuccess();
      } else {
        onError('Error en la autenticación biométrica');
      }
    } catch (error) {
      onError('Error en la autenticación biométrica');
    }
  };

  if (!biometric.isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center gap-2"
      onClick={handleBiometricLogin}
      disabled={biometric.isLoading || !email}
    >
      {biometric.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      Acceder con biometría
    </Button>
  );
};
