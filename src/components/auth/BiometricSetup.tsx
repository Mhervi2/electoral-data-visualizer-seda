
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Trash2, Plus, CheckCircle, AlertCircle, Smartphone, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const BiometricSetup = () => {
  const { user, biometric } = useAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.email) {
      loadCredentials();
      loadDebugInfo();
    }
  }, [user?.email]);

  const loadDebugInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSecure = window.location.protocol === 'https:';
    const hasWebAuthn = 'PublicKeyCredential' in window;
    
    const info = [
      `Dispositivo: ${isMobile ? 'Móvil' : 'Escritorio'}`,
      `Protocolo seguro: ${isSecure ? 'Sí' : 'No'}`,
      `WebAuthn disponible: ${hasWebAuthn ? 'Sí' : 'No'}`,
      `User Agent: ${userAgent.substring(0, 100)}...`
    ].join('\n');
    
    setDebugInfo(info);
  };

  const loadCredentials = async () => {
    if (!user?.email) return;
    
    console.log('Cargando credenciales biométricas...');
    const creds = await biometric.getBiometricCredentials(user.email);
    setCredentials(creds);
    console.log(`Credenciales cargadas: ${creds.length}`);
  };

  const handleRegisterBiometric = async () => {
    if (!user?.email) return;
    
    setIsRegistering(true);
    console.log('Iniciando registro biométrico desde UI...');
    
    try {
      // Detectar dispositivo móvil
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const defaultDeviceName = isMobile ? 'Dispositivo móvil' : 'Computadora';
      
      const result = await biometric.registerBiometric(
        user.email, 
        deviceName || `${defaultDeviceName} ${new Date().toLocaleDateString()}`
      );
      
      if (result.success) {
        toast({
          title: "Biometría registrada",
          description: "Tu dispositivo biométrico ha sido registrado exitosamente.",
        });
        setDeviceName('');
        loadCredentials();
      } else {
        console.error('Error en registro:', result.error);
        toast({
          variant: "destructive",
          title: "Error al registrar",
          description: result.error || "No se pudo registrar la biometría.",
        });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado al registrar la biometría.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemoveCredential = async (credentialId: string) => {
    console.log('Eliminando credencial:', credentialId);
    const result = await biometric.removeBiometricCredential(credentialId);
    
    if (result.success) {
      toast({
        title: "Credencial eliminada",
        description: "La credencial biométrica ha sido eliminada.",
      });
      loadCredentials();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la credencial.",
      });
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  if (biometric.isSupported === false) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Biometría no disponible
            </CardTitle>
            <CardDescription>
              Tu dispositivo no es compatible con autenticación biométrica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Consejos para dispositivos móviles:</h4>
                    <ul className="text-sm text-amber-700 mt-1 space-y-1">
                      <li>• Asegúrate de tener configurado un método biométrico (huella, Face ID, etc.)</li>
                      <li>• Verifica que tu navegador soporte WebAuthn</li>
                      <li>• Intenta desde Chrome o Safari</li>
                      <li>• Asegúrate de estar usando HTTPS</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <details className="border rounded-lg p-4">
                <summary className="cursor-pointer font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Información de debugging
                </summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">{debugInfo}</pre>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (biometric.isSupported === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificando soporte biométrico...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Configuración Biométrica
          </CardTitle>
          <CardDescription>
            Gestiona tus dispositivos biométricos para acceso rápido al panel de administración.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estado de soporte */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                ✅ Tu dispositivo es compatible con autenticación biométrica
              </p>
            </div>
          </div>

          {/* Registrar nuevo dispositivo */}
          <div className="space-y-4">
            <h3 className="font-medium">Registrar nuevo dispositivo</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="deviceName">Nombre del dispositivo (opcional)</Label>
                <Input
                  id="deviceName"
                  placeholder="Ej: iPhone de Juan, Laptop del trabajo"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleRegisterBiometric}
              disabled={isRegistering}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isRegistering ? 'Registrando...' : 'Registrar dispositivo'}
            </Button>
          </div>

          {/* Lista de dispositivos registrados */}
          <div className="space-y-4">
            <h3 className="font-medium">Dispositivos registrados</h3>
            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay dispositivos biométricos registrados.
              </p>
            ) : (
              <div className="space-y-2">
                {credentials.map((credential) => (
                  <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{credential.device_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Registrado: {new Date(credential.created_at).toLocaleDateString()}
                          {credential.last_used_at && (
                            <span> • Último uso: {new Date(credential.last_used_at).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCredential(credential.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {credentials.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  ¡Perfecto! Ahora puedes usar tu biometría para acceder al panel de administración.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional para debugging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información del dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto whitespace-pre-wrap">{debugInfo}</pre>
        </CardContent>
      </Card>
    </div>
  );
};
