import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';

export const SubmitActaToggle = () => {
  const { getSetting, updateSetting, loading } = useSystemSettings();
  const { toast } = useToast();

  const isSubmitActaEnabled = getSetting('submit_acta_enabled', true);

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateSetting('submit_acta_enabled', enabled);
      toast({
        title: "Configuración actualizada",
        description: `El botón "Enviar Acta Electoral" ha sido ${enabled ? 'habilitado' : 'deshabilitado'}.`,
      });
    } catch (error) {
      console.error('Error updating submit acta setting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Envío de Actas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="submit-acta-enabled" className="text-base font-medium">
              Envío de Actas Electorales
            </Label>
            <p className="text-sm text-muted-foreground">
              Controla la visibilidad del botón "Enviar Acta Electoral" en la aplicación.
            </p>
          </div>
          <Switch
            id="submit-acta-enabled"
            checked={isSubmitActaEnabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};