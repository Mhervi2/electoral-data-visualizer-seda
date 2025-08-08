import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';

export interface UnresolvedMunicipality {
  originalName: string;
  normalizedName: string;
  rowIndex: number;
  provincia?: string;
  ca?: string;
}

export interface MunicipalitySuggestion {
  municipality: MpcaData;
  score: number;
  reason: string;
}

export interface MunicipalityResolution {
  originalName: string;
  resolution: MpcaData | 'create-new';
  newMunicipalityData?: {
    name: string;
    provinciaId: number;
  };
}

export interface MunicipalityCreationData {
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
}

export const useMunicipalityResolution = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  };

  // Smart municipality search with suggestions
  const findMunicipalitySuggestions = async (
    unresolvedMunicipality: UnresolvedMunicipality
  ): Promise<MunicipalitySuggestion[]> => {
    const { originalName, provincia, ca } = unresolvedMunicipality;
    const normalizedSearch = normalizeText(originalName);

    try {
      // Get all municipalities for comparison
      let query = supabase
        .from('mpca')
        .select('idm, municipio, provincia, ca, idp, idca, idc');

      // Filter by province or autonomous community if available
      if (provincia) {
        query = query.ilike('provincia', `%${provincia}%`);
      } else if (ca) {
        query = query.ilike('ca', `%${ca}%`);
      }

      const { data: municipalities, error } = await query.limit(1000);

      if (error) throw error;

      const suggestions: MunicipalitySuggestion[] = [];

      for (const municipality of municipalities || []) {
        const normalizedMunicipality = normalizeText(municipality.municipio);
        const distance = levenshteinDistance(normalizedSearch, normalizedMunicipality);
        const maxLength = Math.max(normalizedSearch.length, normalizedMunicipality.length);
        const similarity = 1 - (distance / maxLength);

        let score = similarity;
        let reason = 'Coincidencia parcial';

        // Exact match (highest priority)
        if (normalizedMunicipality === normalizedSearch) {
          score = 1.0;
          reason = 'Coincidencia exacta';
        }
        // Starts with match
        else if (normalizedMunicipality.startsWith(normalizedSearch) || normalizedSearch.startsWith(normalizedMunicipality)) {
          score = Math.max(score, 0.9);
          reason = 'Coincidencia al inicio';
        }
        // Contains match
        else if (normalizedMunicipality.includes(normalizedSearch) || normalizedSearch.includes(normalizedMunicipality)) {
          score = Math.max(score, 0.8);
          reason = 'Contiene coincidencia';
        }

        // Only include suggestions with reasonable similarity
        if (score >= 0.6) {
          suggestions.push({
            municipality: {
              idm: municipality.idm,
              municipio: municipality.municipio,
              idp: municipality.idp,
              provincia: municipality.provincia,
              idca: municipality.idca,
              ca: municipality.ca,
              idc: municipality.idc,
            },
            score,
            reason
          });
        }
      }

      // Sort by score descending
      return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);

    } catch (error) {
      console.error('Error finding municipality suggestions:', error);
      return [];
    }
  };

  // Get available provinces for municipality creation
  const getAvailableProvinces = async (): Promise<Array<{ idp: number; provincia: string; idca: number; ca: string }>> => {
    try {
      const { data, error } = await supabase
        .from('mpca')
        .select('idp, provincia, idca, ca')
        .order('provincia');

      if (error) throw error;

      // Get unique provinces
      const uniqueProvinces = new Map();
      (data || []).forEach(item => {
        if (!uniqueProvinces.has(item.idp)) {
          uniqueProvinces.set(item.idp, {
            idp: item.idp,
            provincia: item.provincia,
            idca: item.idca,
            ca: item.ca
          });
        }
      });

      return Array.from(uniqueProvinces.values());
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  };

  // Get next available IDM for a municipality
  const getNextAvailableIdm = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('mpca')
        .select('idm')
        .order('idm', { ascending: false })
        .limit(1);

      if (error) throw error;

      const maxIdm = data && data.length > 0 ? data[0].idm : 0;
      return Number(maxIdm) + 1;
    } catch (error) {
      console.error('Error getting next IDM:', error);
      throw error;
    }
  };

  // Get next available IDC for a municipality
  const getNextAvailableIdc = async (idp: number): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('mpca')
        .select('idc')
        .eq('idp', idp)
        .order('idc');

      if (error) throw error;

      const usedIdcs = new Set((data || []).map(item => parseInt(item.idc)).filter(idc => !isNaN(idc)));
      
      // Find the first available 3-digit number
      for (let i = 1; i <= 999; i++) {
        if (!usedIdcs.has(i)) {
          return i.toString().padStart(3, '0');
        }
      }

      throw new Error('No hay códigos IDC disponibles para esta provincia');
    } catch (error) {
      console.error('Error getting next IDC:', error);
      throw error;
    }
  };

  // Create a new municipality
  const createNewMunicipality = async (municipalityData: MunicipalityCreationData): Promise<MpcaData> => {
    setIsLoading(true);
    try {
      const [idm, idc] = await Promise.all([
        getNextAvailableIdm(),
        getNextAvailableIdc(municipalityData.idp)
      ]);

      const { data, error } = await supabase
        .from('mpca')
        .insert({
          idm: idm,
          municipio: municipalityData.municipio,
          idp: municipalityData.idp,
          provincia: municipalityData.provincia,
          idca: municipalityData.idca,
          ca: municipalityData.ca,
          idc: idc
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Error al crear municipio: ${error.message}`);
      }

      return {
        idm: data.idm,
        municipio: data.municipio,
        idp: data.idp,
        provincia: data.provincia,
        idca: data.idca,
        ca: data.ca,
        idc: data.idc,
      };
    } catch (error) {
      console.error('Error creating municipality:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Store resolution for future use (learning system) - TODO: Implement after types are updated
  const storeResolution = async (originalName: string, resolvedMunicipality: MpcaData) => {
    // Will be implemented once the municipality_resolutions table types are available
    console.log('Resolution stored:', { originalName, resolvedMunicipality });
  };

  // Check if there's a stored resolution - TODO: Implement after types are updated
  const getStoredResolution = async (originalName: string): Promise<MpcaData | null> => {
    // Will be implemented once the municipality_resolutions table types are available
    return null;
  };

  return {
    findMunicipalitySuggestions,
    getAvailableProvinces,
    createNewMunicipality,
    storeResolution,
    getStoredResolution,
    getNextAvailableIdc,
    getNextAvailableIdm,
    isLoading
  };
};