import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCleanOrphanedImages = () => {
  const [isCleaning, setIsCleaning] = useState(false);
  const { toast } = useToast();

  const cleanOrphanedImages = async () => {
    if (isCleaning) return;

    setIsCleaning(true);
    
    try {
      toast({
        title: "Iniciando limpieza",
        description: "Analizando imágenes huérfanas en el storage...",
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('clean-orphaned-images', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      toast({
        title: "Limpieza completada",
        description: `Se eliminaron ${result.deleted} imágenes huérfanas de ${result.checked} archivos analizados`,
      });

      return result;

    } catch (error) {
      console.error('Clean error:', error);
      toast({
        title: "Error en la limpieza",
        description: error.message || "Error desconocido durante la limpieza",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCleaning(false);
    }
  };

  return {
    cleanOrphanedImages,
    isCleaning
  };
};
