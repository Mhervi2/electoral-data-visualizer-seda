
import { ActaData } from '@/types/acta';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ValidationWithWarnings {
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: string[];
  warnings: string[];
}

export const validateActaData = (actaData: ActaData): ValidationResult => {
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

export const validateActaDataWithWarnings = (actaData: ActaData): ValidationWithWarnings => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate mandatory fields (critical errors)
  if (!actaData.electionId) {
    errors.push("Debe seleccionar una elección.");
  }

  if (!actaData.municipio) {
    errors.push("Debe seleccionar un municipio.");
  }

  if (!actaData.mesaIdentifier) {
    errors.push("Debe introducir el identificador de mesa.");
  }

  if (!actaData.imagen && !actaData.imageUrl) {
    errors.push("Debe subir una imagen del acta electoral.");
  }

  // Validate mesa identifier format (critical error)
  const mesaPattern = /^\d{2}-\d{3}-[A-Z]$/;
  if (actaData.mesaIdentifier && !mesaPattern.test(actaData.mesaIdentifier)) {
    errors.push("El identificador de mesa debe tener el formato: Distrito-Sección-Mesa (ej: 01-001-A)");
  }

  // Numerical validations (warnings, not critical errors)
  const censo = parseInt(actaData.censo) || 0;
  const votantes = parseInt(actaData.votantes) || 0;
  const blancos = parseInt(actaData.blancos) || 0;
  const nulos = parseInt(actaData.nulos) || 0;
  
  const totalVotosCandidaturas = Object.values(actaData.votos)
    .reduce((sum, votes) => sum + (parseInt(votes) || 0), 0);

  if (votantes > censo) {
    warnings.push(`El total de votantes (${votantes}) es mayor que el censo (${censo}).`);
  }

  const expectedTotal = totalVotosCandidaturas + blancos + nulos;
  if (expectedTotal !== votantes) {
    const difference = Math.abs(expectedTotal - votantes);
    warnings.push(
      `La suma de votos no coincide: votos a candidaturas (${totalVotosCandidaturas}) + nulos (${nulos}) + blancos (${blancos}) = ${expectedTotal}, pero el total de votantes es ${votantes}. Diferencia: ${difference} votos.`
    );
  }

  return {
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings
  };
};
