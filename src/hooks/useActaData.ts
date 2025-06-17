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
      idm: Number(item.idm) || 0,
      municipio: item.municipio || '',
      idp: Number(item.idp) || 0,
      provincia: item.provincia || '',
      idca: Number(item.idca) || 0,
      ca: item.ca || '',
    }));
  };

  const fetchPoliticalParties = async (): Promise<PoliticalParty[]> => {
    console.log("Fetching political parties...");
    const { data, error } = await supabase
      .from('political_parties')
      .select('id, name, siglas, color')
      .order('siglas', { ascending: true });
    
    if (error) {
      console.error('Error fetching political parties:', error);
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
  };

  const fetchElections = async (): Promise<Election[]> => {
    console.log("Fetching elections...");
    const { data, error } = await supabase
      .from('elections')
      .select('id, name, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching elections:', error);
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
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting to fetch all data...');
        
        const [mpcaResult, partiesResult, electionsResult] = await Promise.allSettled([
          fetchMpcaData(),
          fetchPoliticalParties(),
          fetchElections(),
        ]);

        if (!isMounted) return;

        if (mpcaResult.status === 'fulfilled') {
          setMpcaData(mpcaResult.value);
          console.log(`Successfully loaded ${mpcaResult.value.length} municipalities`);
        } else {
          console.error('Failed to fetch MPCA data:', mpcaResult.reason);
          setError('Error al cargar los municipios.');
          setMpcaData([]);
        }

        if (partiesResult.status === 'fulfilled') {
          setPoliticalParties(partiesResult.value);
          console.log(`Successfully loaded ${partiesResult.value.length} political parties`);
        } else {
          console.error('Failed to fetch political parties:', partiesResult.reason);
          setPoliticalParties([]);
        }

        if (electionsResult.status === 'fulfilled') {
          setElections(electionsResult.value);
          console.log(`Successfully loaded ${electionsResult.value.length} elections`);
        } else {
          console.error('Failed to fetch elections:', electionsResult.reason);
          setElections([]);
        }

      } catch (err: any) {
        console.error('Unexpected error in fetchAllData:', err);
        if (isMounted) {
          setError('Error inesperado al cargar los datos.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    mpcaData,
    politicalParties,
    elections,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-trigger the useEffect
      window.location.reload();
    }
  };
};
