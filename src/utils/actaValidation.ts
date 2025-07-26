
import { ActaData } from '@/types/acta';

export const validateActaData = (actaData: ActaData): { isValid: boolean; message?: string } => {
  // Validate mandatory fields
  if (!actaData.electionId) {
    return {
      isValid: false,
      message: "Debe seleccionar una elección."
    };
  }

  if (!actaData.municipio) {
    return {
      isValid: false,
      message: "Debe seleccionar un municipio."
    };
  }

  if (!actaData.mesaIdentifier) {
    return {
      isValid: false,
      message: "Debe introducir el identificador de mesa."
    };
  }

  if (!actaData.imagen && !actaData.imageUrl) {
    return {
      isValid: false,
      message: "Debe subir una imagen del acta electoral."
    };
  }

  // Validate mesa identifier format (now requires 2-digit district)
  const mesaPattern = /^\d{2}-\d{3}-[A-Z]$/;
  if (!mesaPattern.test(actaData.mesaIdentifier)) {
    return {
      isValid: false,
      message: "El identificador de mesa debe tener el formato: Distrito-Sección-Mesa (ej: 01-001-A)"
    };
  }

  const censo = parseInt(actaData.censo) || 0;
  const votantes = parseInt(actaData.votantes) || 0;
  const blancos = parseInt(actaData.blancos) || 0;
  const nulos = parseInt(actaData.nulos) || 0;
  
  const totalVotosCandidaturas = Object.values(actaData.votos)
    .reduce((sum, votes) => sum + (parseInt(votes) || 0), 0);

  if (votantes > censo) {
    return {
      isValid: false,
      message: "El total de votantes no puede ser mayor que el censo."
    };
  }

  if (totalVotosCandidaturas + blancos + nulos !== votantes) {
    return {
      isValid: false,
      message: "La suma de votos a candidaturas + blancos + nulos debe igual al total de votantes."
    };
  }

  return { isValid: true };
};
