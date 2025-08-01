import { useState } from 'react';
import { useSecureFileUpload } from './useSecureFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MpcaData } from '@/types/acta';

export const useBulkImageUpload = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile } = useSecureFileUpload();
  const { toast } = useToast();

  const submitImageOnlyActs = async (electionId: string, images: File[], municipalityData: MpcaData | null) => {
    if (!electionId || images.length === 0 || !municipalityData) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe seleccionar una elección, un municipio y al menos una imagen.",
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const results = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
          // Upload image to storage
          const imageUrl = await uploadFile(image, 'electoral-acts', {
            maxSizeInMB: 5,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            folder: 'acts',
            requireAuth: false
          });

          if (!imageUrl) {
            throw new Error(`Failed to upload image ${image.name}`);
          }

          // Create electoral act with minimal data
          const { data: actData, error: actError } = await supabase
            .from('electoral_acts')
            .insert({
              election_id: electionId,
              completion_status: 'image_only',
              source_type: 'user',
              image_url: imageUrl,
              municipality_idm: municipalityData.idm,
              // Minimal required fields with defaults
              census_total: 0,
              total_voters: 0,
              blank_votes: 0,
              null_votes: 0,
              mesa_identifier: null,
              submitted_by: null // Will be set if user is authenticated
            })
            .select('id')
            .single();

          if (actError) {
            console.error('Error creating electoral act:', actError);
            throw new Error(`Error creating act for image ${image.name}: ${actError.message}`);
          }

          results.push({
            success: true,
            actId: actData.id,
            imageName: image.name,
            imageUrl
          });

        } catch (error) {
          console.error(`Error processing image ${image.name}:`, error);
          results.push({
            success: false,
            imageName: image.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: "Actas creadas exitosamente",
          description: `Se crearon ${successCount} acta${successCount > 1 ? 's' : ''} con imagen${successCount > 1 ? 'es' : ''}. Puede completar los datos en la sección de Gestión de Actas.`,
        });
      }

      if (failureCount > 0) {
        const failedImages = results
          .filter(r => !r.success)
          .map(r => r.imageName)
          .join(', ');
        
        toast({
          variant: "destructive",
          title: "Algunas imágenes fallaron",
          description: `No se pudieron procesar: ${failedImages}`,
        });
      }

      return successCount > 0;

    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast({
        variant: "destructive",
        title: "Error en la carga",
        description: "Ocurrió un error durante la carga masiva de imágenes.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitImageOnlyActs
  };
};