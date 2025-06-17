
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';

export const useMpcaData = () => {
  const [mpcaData, setMpcaData] = useState<MpcaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMpcaData = async () => {
      try {
        console.log('Fetching MPCA data...');
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca')
          .order('municipio', { ascending: true });

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(`Error al cargar municipios: ${supabaseError.message}`);
        }

        if (!data || data.length === 0) {
          console.warn('No MPCA data found');
          setMpcaData([]);
          setError('No se encontraron municipios en la base de datos');
          return;
        }

        const transformedData: MpcaData[] = data.map(item => ({
          idm: Number(item.idm),
          municipio: item.municipio || '',
          idp: Number(item.idp) || 0,
          provincia: item.provincia || '',
          idca: Number(item.idca) || 0,
          ca: item.ca || '',
        }));

        console.log(`Successfully loaded ${transformedData.length} municipalities`);
        setMpcaData(transformedData);
      } catch (err: any) {
        console.error('Error fetching MPCA data:', err);
        setError(err.message || 'Error desconocido al cargar los municipios');
        setMpcaData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMpcaData();
  }, []);

  return {
    mpcaData,
    loading,
    error,
  };
};
