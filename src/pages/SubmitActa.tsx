
import React from 'react';
import { SubmitActaForm } from '@/components/acta/SubmitActaForm';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const SubmitActa = () => {
  const { getSetting } = useSystemSettings();
  const isSubmitActaEnabled = getSetting('submit_acta_enabled', true);

  if (!isSubmitActaEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
          Enviar Acta Electoral
        </h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <CardTitle>Función no disponible</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              La funcionalidad de envío de actas electorales está temporalmente deshabilitada.
              Contacta con el administrador del sistema para más información.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
        Enviar Acta Electoral
      </h1>

      <SubmitActaForm />
    </div>
  );
};

export default SubmitActa;
