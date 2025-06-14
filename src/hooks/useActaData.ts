
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
      try {
        await Promise.all([
          fetchMpcaData(),
          fetchPoliticalParties(),
          fetchElections()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  const fetchMpcaData = async () => {
    try {
      const { data, error } = await supabase
        .from('mpca')
        .select('idm, municipio, idp, provincia, idca, ca')
        .order('municipio');

      if (error) {
        console.error('Error fetching MPCA data:', error);
        setMpcaData([]);
        return;
      }
      
      console.log('MPCA data loaded successfully:', data?.length, 'municipalities');
      setMpcaData(data || []);
    } catch (error) {
      console.error('Error fetching MPCA data:', error);
      setMpcaData([]);
    }
  };

  const fetchPoliticalParties = async () => {
    try {
      const { data, error } = await supabase
        .from('political_parties')
        .select('*')
        .order('siglas');

      if (error) {
        console.error('Error fetching political parties:', error);
        throw error;
      }
      
      setPoliticalParties(data || []);
    } catch (error) {
      console.error('Error fetching political parties:', error);
      setPoliticalParties([]);
    }
  };

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching elections:', error);
        throw error;
      }
      
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
