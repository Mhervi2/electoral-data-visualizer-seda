import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteRecentActs = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteRecentActs = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    
    try {
      toast({
        title: "Iniciando eliminación",
        description: "Eliminando las 500 actas más recientes...",
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('delete-recent-acts', {
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
        title: "Eliminación completada",
        description: `Se eliminaron ${result.deleted} actas electorales correctamente`,
      });

      return result;

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error en la eliminación",
        description: error.message || "Error desconocido durante la eliminación",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteRecentActs,
    isDeleting
  };
};
