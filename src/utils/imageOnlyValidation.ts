import { MpcaData } from '@/types/acta';

export const validateImageOnlyActa = (electionId: string, images: File[], municipalityData: MpcaData | null): { isValid: boolean; message?: string } => {
  // Validate election selection
  if (!electionId) {
    return {
      isValid: false,
      message: "Debe seleccionar una elección."
    };
  }

  // Validate municipality selection
  if (!municipalityData) {
    return {
      isValid: false,
      message: "Debe seleccionar un municipio."
    };
  }

  // Validate images
  if (!images || images.length === 0) {
    return {
      isValid: false,
      message: "Debe subir al menos una imagen del acta electoral."
    };
  }

  if (images.length > 5) {
    return {
      isValid: false,
      message: "No se pueden subir más de 5 imágenes a la vez."
    };
  }

  // Validate each image
  for (const image of images) {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      return {
        isValid: false,
        message: `El archivo ${image.name} debe ser JPG, PNG o WebP.`
      };
    }

    // Validate file size (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return {
        isValid: false,
        message: `El archivo ${image.name} debe ser menor a 5MB.`
      };
    }
  }

  return { isValid: true };
};