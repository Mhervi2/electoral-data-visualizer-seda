
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';

export const useActaData = () => {
  const [mpcaData, setMpcaData] = useState<MpcaData[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMpcaData(),
        fetchPoliticalParties(),
        fetchElections()
      ]);
      setLoading(false);
    };
    
    fetchAllData();
  }, []);

  const fetchMpcaData = async () => {
    try {
      console.log('Fetching MPCA data...');
      const { data, error } = await supabase
        .from('mpca')
        .select('*')
        .order('municipio');

      if (error) {
        console.error('Error fetching MPCA data:', error);
        throw error;
      }
      
      console.log('MPCA data fetched successfully:', data?.length, 'municipalities');
      console.log('Sample data:', data?.slice(0, 3));
      setMpcaData(data || []);
    } catch (error) {
      console.error('Error fetching MPCA data:', error);
      setMpcaData([]);
    }
  };

  const fetchPoliticalParties = async () => {
    try {
      console.log('Fetching political parties...');
      const { data, error } = await supabase
        .from('political_parties')
        .select('*')
        .order('siglas');

      if (error) {
        console.error('Error fetching political parties:', error);
        throw error;
      }
      
      console.log('Political parties fetched:', data?.length, 'parties');
      setPoliticalParties(data || []);
    } catch (error) {
      console.error('Error fetching political parties:', error);
      setPoliticalParties([]);
    }
  };

  const fetchElections = async () => {
    try {
      console.log('Fetching elections...');
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching elections:', error);
        throw error;
      }
      
      console.log('Elections fetched:', data?.length, 'elections');
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      setElections([]);
    }
  };

  return {
    mpcaData,
    politicalParties,
    elections,
    loading
  };
};
