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
      const { data, error } = await supabase
        .rpc('get_system_settings');

      if (error) throw error;

      const settingsMap = (data || []).reduce((acc: Record<string, any>, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, any>);

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .rpc('update_system_setting', {
          p_key: key,
          p_value: value
        });

      if (error) throw error;

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