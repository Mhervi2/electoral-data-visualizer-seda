
import { supabase } from '@/integrations/supabase/client';
import { Election } from '@/types/acta';

export const fetchElections = async (): Promise<Election[]> => {
  console.log("Fetching elections...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { data, error } = await supabase
      .from('elections')
      .select('id, name, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Error al cargar las elecciones: ${error.message}`);
    }

    if (!data) {
      console.warn('No elections found');
      return [];
    }

    console.log(`Elections fetched successfully: ${data.length} records.`);
    return data.map(election => ({
      id: election.id,
      name: election.name || '',
      status: election.status || 'active',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};
