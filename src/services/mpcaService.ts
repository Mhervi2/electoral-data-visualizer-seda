
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';

export const fetchMpcaData = async (): Promise<MpcaData[]> => {
  console.log("Fetching MPCA data...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { data, error } = await supabase
      .from('mpca')
      .select('idm, municipio, provincia, ca, idp, idca')
      .order('municipio', { ascending: true });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Error de base de datos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No MPCA data returned');
      return [];
    }

    console.log(`MPCA data fetched successfully: ${data.length} records.`);
    return data.map(item => ({
      idm: Number(item.idm) || 0,
      municipio: item.municipio || '',
      idp: Number(item.idp) || 0,
      provincia: item.provincia || '',
      idca: Number(item.idca) || 0,
      ca: item.ca || '',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};
