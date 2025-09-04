import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PoliticalParty } from '@/types/acta';

export interface UnresolvedParty {
  originalName: string;
  normalizedName: string;
  columnIndex: number;
}

export interface PartySuggestion {
  party: PoliticalParty;
  score: number;
  reason: string;
}

export interface PartyResolution {
  originalName: string;
  resolution: PoliticalParty | 'create-new';
  newPartyData?: {
    name: string;
    siglas: string;
    color: string;
  };
}

export interface PartyCreationData {
  name: string;
  siglas: string;
  color: string;
}

export const usePartyResolution = () => {
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

  // Generate a random color for new parties
  const generateRandomColor = (): string => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Smart party search with suggestions
  const findPartySuggestions = async (
    unresolvedParty: UnresolvedParty
  ): Promise<PartySuggestion[]> => {
    const { originalName } = unresolvedParty;
    const normalizedSearch = normalizeText(originalName);

    try {
      // Get all political parties for comparison
      const { data: parties, error } = await supabase
        .from('political_parties')
        .select('id, name, siglas, color, party_identifier');

      if (error) throw error;

      const suggestions: PartySuggestion[] = [];

      for (const party of parties || []) {
        const normalizedPartyName = normalizeText(party.name);
        const normalizedPartySiglas = normalizeText(party.siglas || '');
        
        // Calculate similarity with party name
        const nameDistance = levenshteinDistance(normalizedSearch, normalizedPartyName);
        const nameMaxLength = Math.max(normalizedSearch.length, normalizedPartyName.length);
        const nameSimilarity = 1 - (nameDistance / nameMaxLength);

        // Calculate similarity with party siglas
        let siglasSimilarity = 0;
        if (normalizedPartySiglas) {
          const siglasDistance = levenshteinDistance(normalizedSearch, normalizedPartySiglas);
          const siglasMaxLength = Math.max(normalizedSearch.length, normalizedPartySiglas.length);
          siglasSimilarity = 1 - (siglasDistance / siglasMaxLength);
        }

        // Use the best similarity score
        let score = Math.max(nameSimilarity, siglasSimilarity);
        let reason = 'Coincidencia parcial';

        // Exact match (highest priority)
        if (normalizedPartyName === normalizedSearch || normalizedPartySiglas === normalizedSearch) {
          score = 1.0;
          reason = 'Coincidencia exacta';
        }
        // Starts with match
        else if (normalizedPartyName.startsWith(normalizedSearch) || 
                normalizedSearch.startsWith(normalizedPartyName) ||
                (normalizedPartySiglas && (normalizedPartySiglas.startsWith(normalizedSearch) || normalizedSearch.startsWith(normalizedPartySiglas)))) {
          score = Math.max(score, 0.9);
          reason = 'Coincidencia al inicio';
        }
        // Contains match
        else if (normalizedPartyName.includes(normalizedSearch) || 
                normalizedSearch.includes(normalizedPartyName) ||
                (normalizedPartySiglas && (normalizedPartySiglas.includes(normalizedSearch) || normalizedSearch.includes(normalizedPartySiglas)))) {
          score = Math.max(score, 0.8);
          reason = 'Contiene coincidencia';
        }

        // Determine which field matched better
        if (siglasSimilarity > nameSimilarity && normalizedPartySiglas) {
          reason += ` (siglas: ${party.siglas})`;
        } else {
          reason += ` (nombre)`;
        }

        // Only include suggestions with reasonable similarity
        if (score >= 0.6) {
          suggestions.push({
            party: {
              id: party.id,
              name: party.name,
              siglas: party.siglas,
              color: party.color,
              party_identifier: party.party_identifier
            },
            score,
            reason
          });
        }
      }

      // Sort by score descending
      return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);

    } catch (error) {
      console.error('Error finding party suggestions:', error);
      return [];
    }
  };

  // Create a new political party
  const createNewParty = async (partyData: PartyCreationData): Promise<PoliticalParty> => {
    setIsLoading(true);
    try {
      // Generate ID from name
      const id = partyData.name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_');

      const { data, error } = await supabase
        .from('political_parties')
        .insert({
          id,
          name: partyData.name.trim(),
          siglas: partyData.siglas.trim(),
          color: partyData.color
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating party:', error);
        throw new Error(`Error al crear el partido: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        siglas: data.siglas,
        color: data.color,
        party_identifier: data.party_identifier
      };
    } catch (error) {
      console.error('Error creating party:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate automatic siglas from party name
  const generateSiglas = (partyName: string): string => {
    const words = partyName
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (words.length === 1) {
      // Single word: take first 3-4 characters
      return words[0].substring(0, Math.min(4, words[0].length));
    } else if (words.length <= 4) {
      // Multiple words: take first letter of each
      return words.map(word => word[0]).join('');
    } else {
      // Many words: take first letter of first 4 words
      return words.slice(0, 4).map(word => word[0]).join('');
    }
  };

  return {
    findPartySuggestions,
    createNewParty,
    generateSiglas,
    generateRandomColor,
    normalizeText,
    isLoading
  };
};