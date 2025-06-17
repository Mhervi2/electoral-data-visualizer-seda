
import { useIndraFileProcessor } from './useIndraFileProcessor';
import { useToast } from '@/hooks/use-toast';

export const useIndraFileUpload = () => {
  const { processIndraFile, processing } = useIndraFileProcessor();
  const { toast } = useToast();

  const uploadIndraFile = async (file: File) => {
    try {
      // Validate file
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos CSV, XLS y XLSX.",
        });
        return;
      }

      const result = await processIndraFile(file);

      if (result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Procesamiento completado con errores",
          description: `Se procesaron ${result.processedRows} filas. ${result.errors.length} errores encontrados.`,
        });
        console.error('Processing errors:', result.errors);
      } else {
        toast({
          title: "Archivo INDRA procesado exitosamente",
          description: `Se crearon ${result.createdActs} actas y ${result.createdVotes} votos.`,
        });
      }

      return result;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar archivo",
        description: "No se pudo procesar el archivo INDRA.",
      });
    }
  };

  return {
    uploadIndraFile,
    processing
  };
};
