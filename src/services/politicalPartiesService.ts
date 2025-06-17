
import { supabase } from '@/integrations/supabase/client';
import { PoliticalParty } from '@/types/acta';

export const fetchPoliticalParties = async (): Promise<PoliticalParty[]> => {
  console.log("Fetching political parties...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { data, error } = await supabase
      .from('political_parties')
      .select('id, name, siglas, color')
      .order('siglas', { ascending: true });
    
    clearTimeout(timeoutId);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Error al cargar los partidos políticos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No political parties found in database');
      return [];
    }

    console.log(`Raw data from Supabase:`, data);
    console.log(`Political parties fetched successfully: ${data.length} records.`);
    
    // Add runtime validation and improved mapping
    const mappedData = data.map((party, index) => {
      console.log(`Mapping party ${index + 1}:`, party);
      
      // Validate required fields
      if (!party.id || !party.siglas) {
        console.warn(`Invalid party data at index ${index}:`, party);
      }
      
      const mappedParty: PoliticalParty = {
        id: String(party.id || ''),
        name: String(party.name || ''),
        siglas: String(party.siglas || ''),
        color: String(party.color || '#6B7280'),
      };
      
      console.log(`Mapped party ${index + 1}:`, mappedParty);
      return mappedParty;
    });

    console.log(`Final mapped political parties:`, mappedData);
    return mappedData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error in fetchPoliticalParties:', error);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};
