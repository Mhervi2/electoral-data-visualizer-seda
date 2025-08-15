import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { useToast } from '@/hooks/use-toast';

export const MailVotingToggle = () => {
  const { isMailVotingEnabled, setMailVotingEnabled } = useSystemConfig();
  const { toast } = useToast();

  const handleToggle = (enabled: boolean) => {
    setMailVotingEnabled(enabled);
    toast({
      title: "Configuración actualizada",
      description: `El voto por correo ha sido ${enabled ? 'habilitado' : 'deshabilitado'}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Voto por Correo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="mail-voting-enabled" className="text-base font-medium">
              Voto por Correo
            </Label>
            <p className="text-sm text-muted-foreground">
              Controla la visibilidad de todas las funciones relacionadas con el voto por correo en la aplicación.
            </p>
          </div>
          <Switch
            id="mail-voting-enabled"
            checked={isMailVotingEnabled()}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};