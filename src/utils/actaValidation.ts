
import { ActaData } from '@/types/acta';

export const validateActaData = (actaData: ActaData): { isValid: boolean; message?: string } => {
  // Validar campos obligatorios
  if (!actaData.electionId) {
    return { isValid: false, message: "Debe seleccionar una elección." };
  }

  if (!actaData.municipio) {
    return { isValid: false, message: "Debe seleccionar un municipio." };
  }

  if (!actaData.distrito) {
    return { isValid: false, message: "Debe especificar el distrito." };
  }

  if (!actaData.seccion) {
    return { isValid: false, message: "Debe especificar la sección." };
  }

  if (!actaData.mesa) {
    return { isValid: false, message: "Debe especificar la mesa." };
  }

  // Validar números
  const censo = parseInt(actaData.censo) || 0;
  const votantes = parseInt(actaData.votantes) || 0;
  const blancos = parseInt(actaData.blancos) || 0;
  const nulos = parseInt(actaData.nulos) || 0;

  if (censo <= 0) {
    return { isValid: false, message: "El censo debe ser mayor que 0." };
  }

  if (votantes < 0) {
    return { isValid: false, message: "El número de votantes no puede ser negativo." };
  }

  if (blancos < 0) {
    return { isValid: false, message: "Los votos en blanco no pueden ser negativos." };
  }

  if (nulos < 0) {
    return { isValid: false, message: "Los votos nulos no pueden ser negativos." };
  }

  if (votantes > censo) {
    return {
      isValid: false,
      message: "El total de votantes no puede ser mayor que el censo."
    };
  }

  // Validar suma de votos
  const totalVotosCandidaturas = Object.values(actaData.votos)
    .reduce((sum, votes) => {
      const voteNumber = parseInt(votes) || 0;
      return sum + (voteNumber >= 0 ? voteNumber : 0);
    }, 0);

  const expectedTotal = totalVotosCandidaturas + blancos + nulos;
  
  if (expectedTotal !== votantes) {
    return {
      isValid: false,
      message: `La suma de votos (${totalVotosCandidaturas} candidaturas + ${blancos} blancos + ${nulos} nulos = ${expectedTotal}) debe ser igual al total de votantes (${votantes}).`
    };
  }

  // Validar que al menos hay algún voto a candidaturas si hay votantes
  if (votantes > 0 && totalVotosCandidaturas === 0 && blancos === 0 && nulos === 0) {
    return {
      isValid: false,
      message: "Debe distribuir los votos entre candidaturas, blancos y nulos."
    };
  }

  return { isValid: true };
};
