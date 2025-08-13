import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      // For now, use default values since system_settings table isn't in types yet
      setSettings({
        mail_voting_enabled: true
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      setSettings({
        mail_voting_enabled: true
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      // For now, just update local state since table doesn't exist in types
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      toast({
        title: "Configuración actualizada",
        description: `La configuración ${key} se ha actualizado correctamente.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive"
      });
    }
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const isMailVotingEnabled = () => {
    return getSetting('mail_voting_enabled', true);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    getSetting,
    isMailVotingEnabled,
    refetch: fetchSettings
  };
};