
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  folder?: string;
  requireAuth?: boolean;
}

export const useSecureFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    bucketName: string = 'electoral-acts', 
    options: UploadOptions = {}
  ): Promise<string | null> => {
    const {
      maxSizeInMB = 10,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      folder = 'acts',
      requireAuth = true
    } = options;

    setUploading(true);

    try {
      // Validate file size
      const maxSize = maxSizeInMB * 1024 * 1024; // Convert to bytes
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: `El archivo no puede superar los ${maxSizeInMB}MB.`,
        });
        return null;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no válido",
          description: `Solo se permiten archivos de tipo: ${allowedTypes.join(', ')}`,
        });
        return null;
      }

      // Get current user (optional for public uploads)
      let userId = 'anonymous';
      if (requireAuth) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "Debe iniciar sesión para subir archivos.",
          });
          return null;
        }
        userId = user.id;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          variant: "destructive",
          title: "Error al subir archivo",
          description: error.message,
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('File uploaded successfully:', publicUrl);

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente.",
      });

      return publicUrl;

    } catch (error) {
      console.error('Upload exception:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al subir el archivo.",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // New method specifically for Excel files
  const uploadExcelFile = async (file: File): Promise<string | null> => {
    return uploadFile(file, 'electoral-files', {
      maxSizeInMB: 50, // Excel files can be larger
      allowedTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ],
      folder: 'excel',
      requireAuth: true
    });
  };

  return { uploadFile, uploadExcelFile, uploading };
};
