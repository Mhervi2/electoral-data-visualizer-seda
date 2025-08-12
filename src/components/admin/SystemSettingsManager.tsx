import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const SystemSettingsManager = () => {
  const { settings, loading, updateSetting, isMailVotingEnabled } = useSystemSettings();

  const handleMailVotingToggle = (enabled: boolean) => {
    updateSetting('mail_voting_enabled', enabled);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Sistema</CardTitle>
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
            onCheckedChange={handleMailVotingToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};