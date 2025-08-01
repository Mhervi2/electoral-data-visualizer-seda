import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    
    try {
      toast({
        title: "Iniciando exportación",
        description: "Preparando la exportación de datos...",
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('export-database-csv', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Get the blob from the response
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database_export_${new Date().toISOString().split('T')[0]}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportación completada",
        description: "Los datos se han exportado correctamente",
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error en la exportación",
        description: error.message || "Error desconocido durante la exportación",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting
  };
};