
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';

export const useActaData = () => {
  const [mpcaData, setMpcaData] = useState<MpcaData[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMpcaData = async (): Promise<MpcaData[]> => {
    try {
      console.log("Fetching MPCA data...");
      const { data, error: supabaseError } = await supabase
        .from('mpca')
        .select('idm, municipio, provincia, ca, idp, idca')
        .order('municipio', { ascending: true });

      if (supabaseError) {
        console.error('Supabase error fetching MPCA data:', supabaseError);
        throw new Error(`Error de base de datos: ${supabaseError.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('No MPCA data returned');
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
    } catch (error: any) {
      console.error('Error fetching MPCA data:', error);
      throw error;
    }
  };

  const fetchPoliticalParties = async (): Promise<PoliticalParty[]> => {
    try {
      const { data, error } = await supabase
        .from('political_parties')
        .select('*')
        .order('siglas');
      
      if (error) {
        console.error('Error fetching political parties:', error);
        throw new Error('Error al cargar los partidos políticos.');
      }
      return data || [];
    } catch (error: any) {
      console.error('Error in fetchPoliticalParties:', error);
      throw error;
    }
  };

  const fetchElections = async (): Promise<Election[]> => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching elections:', error);
        throw new Error('Error al cargar las elecciones.');
      }
      return data || [];
    } catch (error: any) {
      console.error('Error in fetchElections:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting to fetch all data...');
        
        // Fetch all data in parallel but handle errors individually
        const [mpcaResult, partiesResult, electionsResult] = await Promise.allSettled([
          fetchMpcaData(),
          fetchPoliticalParties(),
          fetchElections(),
        ]);

        // Handle MPCA data
        if (mpcaResult.status === 'fulfilled') {
          setMpcaData(mpcaResult.value);
          console.log(`Successfully loaded ${mpcaResult.value.length} municipalities`);
        } else {
          console.error('Failed to fetch MPCA data:', mpcaResult.reason);
          setError('Error al cargar los municipios. Por favor, recarga la página.');
          setMpcaData([]);
        }

        // Handle political parties
        if (partiesResult.status === 'fulfilled') {
          setPoliticalParties(partiesResult.value);
          console.log(`Successfully loaded ${partiesResult.value.length} political parties`);
        } else {
          console.error('Failed to fetch political parties:', partiesResult.reason);
          setPoliticalParties([]);
        }

        // Handle elections
        if (electionsResult.status === 'fulfilled') {
          setElections(electionsResult.value);
          console.log(`Successfully loaded ${electionsResult.value.length} elections`);
        } else {
          console.error('Failed to fetch elections:', electionsResult.reason);
          setElections([]);
        }

      } catch (err: any) {
        console.error('Unexpected error in fetchAllData:', err);
        setError('Error inesperado al cargar los datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    mpcaData,
    politicalParties,
    elections,
    loading,
    error,
  };
};
