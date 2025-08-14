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
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error('Error fetching system settings:', error);
        // Use default values on error
        setSettings({
          mail_voting_enabled: true
        });
        return;
      }

      // Convert array to object
      const settingsObj: Record<string, any> = {};
      data?.forEach((setting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      setSettings(settingsObj);
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
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating setting:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar la configuración.",
          variant: "destructive"
        });
        return;
      }

      // Update local state after successful database update
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      toast({
        title: "Configuración actualizada",
        description: `La configuración se ha actualizado correctamente.`,
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