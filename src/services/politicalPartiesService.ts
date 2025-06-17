
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
      throw new Error(`Error al cargar los partidos políticos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No political parties found');
      return [];
    }

    console.log(`Political parties fetched successfully: ${data.length} records.`);
    return data.map(party => ({
      id: party.id,
      name: party.name || '',
      siglas: party.siglas || '',
      color: party.color || '#6B7280',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};
