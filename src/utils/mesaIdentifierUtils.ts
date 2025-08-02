import { MpcaData } from '@/types/acta';

/**
 * Genera el identificador completo de mesa en formato XX-YY-ZZZ-DD-SSS-M
 * @param municipalityData Datos del municipio seleccionado
 * @param mesaIdentifier Identificador de mesa en formato DD-SSS-M
 * @returns Identificador completo en formato XX-YY-ZZZ-DD-SSS-M
 */
export const generateFullMesaIdentifier = (
  municipalityData: MpcaData | null,
  mesaIdentifier: string
): string | null => {
  if (!municipalityData || !mesaIdentifier) {
    return null;
  }

  // Validar formato del mesa_identifier (DD-SSS-M)
  const mesaParts = mesaIdentifier.split('-');
  if (mesaParts.length !== 3) {
    return null;
  }

  const [district, section, table] = mesaParts;

  // Formatear idm a 3 dígitos
  const formattedIdm = municipalityData.idm.toString().padStart(3, '0');

  // Formatear idca a 2 dígitos
  const formattedIdca = municipalityData.idca.toString().padStart(2, '0');

  // Formatear idp a 2 dígitos
  const formattedIdp = municipalityData.idp.toString().padStart(2, '0');

  // Generar identificador completo: XX-YY-ZZZ-DD-SSS-M
  return `${formattedIdca}-${formattedIdp}-${formattedIdm}-${district}-${section}-${table}`;
};

/**
 * Parsea un identificador completo de mesa
 * @param fullIdentifier Identificador completo en formato XX-YY-ZZZ-DD-SSS-M
 * @returns Objeto con las partes del identificador
 */
export const parseFullMesaIdentifier = (fullIdentifier: string | null | undefined) => {
  if (!fullIdentifier) {
    return {
      idca: '',
      idp: '',
      idm: '',
      district: '',
      section: '',
      table: '',
      isValid: false
    };
  }

  const parts = fullIdentifier.split('-');
  if (parts.length !== 6) {
    return {
      idca: '',
      idp: '',
      idm: '',
      district: '',
      section: '',
      table: '',
      isValid: false
    };
  }

  return {
    idca: parts[0],
    idp: parts[1], 
    idm: parts[2],
    district: parts[3],
    section: parts[4],
    table: parts[5],
    isValid: true
  };
};

/**
 * Valida el formato del identificador completo
 * @param fullIdentifier Identificador completo
 * @returns true si el formato es válido
 */
export const validateFullMesaIdentifier = (fullIdentifier: string): boolean => {
  const parsed = parseFullMesaIdentifier(fullIdentifier);
  return parsed.isValid;
};

/**
 * Convierte un identificador completo a formato corto (DD-SSS-M)
 * @param fullIdentifier Identificador completo en formato XX-YY-ZZZ-DD-SSS-M
 * @returns Identificador corto en formato DD-SSS-M
 */
export const fullToShortMesaIdentifier = (fullIdentifier: string | null | undefined): string => {
  const parsed = parseFullMesaIdentifier(fullIdentifier);
  if (!parsed.isValid) {
    return '';
  }
  
  return `${parsed.district}-${parsed.section}-${parsed.table}`;
};