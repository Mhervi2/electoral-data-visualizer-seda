
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';

export const useActaData = () => {
  const [mpcaData, setMpcaData] = useState<MpcaData[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mpcaResult, partiesResult, electionsResult] = await Promise.allSettled([
          fetchMpcaData(),
          fetchPoliticalParties(),
          fetchElections(),
        ]);

        if (mpcaResult.status === 'fulfilled') {
          setMpcaData(mpcaResult.value);
        } else {
          console.error('Failed to fetch MPCA data:', mpcaResult.reason);
          setError('Error al cargar los municipios. Revisa la consola para más detalles.');
          setMpcaData([]);
        }

        if (partiesResult.status === 'fulfilled') {
          setPoliticalParties(partiesResult.value);
        } else {
          console.error('Failed to fetch political parties:', partiesResult.reason);
          setPoliticalParties([]);
        }

        if (electionsResult.status === 'fulfilled') {
          setElections(electionsResult.value);
        } else {
          console.error('Failed to fetch elections:', electionsResult.reason);
          setElections([]);
        }
      } catch (err) {
        console.error('An unexpected error occurred in fetchAllData:', err);
        setError('Ocurrió un error inesperado al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchMpcaData = async (): Promise<MpcaData[]> => {
    console.log('Fetching MPCA data...');
    const { data, error } = await supabase
      .from('mpca')
      .select('idm, municipio, provincia, ca, idp, idca')
      .order('municipio', { ascending: true });

    if (error) {
      console.error('Supabase error fetching MPCA data:', error);
      throw new Error(`Detalles del error: ${error.message}`);
    }

    if (!data) {
      console.warn('No MPCA data returned from Supabase.');
      return [];
    }

    console.log(`MPCA data fetched successfully: ${data.length} records.`);
    
    return data.map(item => ({
      idm: Number(item.idm),
      municipio: item.municipio || '',
      idp: Number(item.idp) || 0,
      provincia: item.provincia || '',
      idca: Number(item.idca) || 0,
      ca: item.ca || '',
    }));
  };

  const fetchPoliticalParties = async (): Promise<PoliticalParty[]> => {
    const { data, error } = await supabase.from('political_parties').select('*').order('siglas');
    if (error) {
      console.error('Error fetching political parties:', error);
      throw error;
    }
    return data || [];
  };

  const fetchElections = async (): Promise<Election[]> => {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching elections:', error);
      throw error;
    }
    return data || [];
  };

  return {
    mpcaData,
    politicalParties,
    elections,
    loading,
    error,
  };
};
