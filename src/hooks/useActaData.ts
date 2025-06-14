
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';

export const useActaData = () => {
  const [mpcaData, setMpcaData] = useState<MpcaData[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    fetchMpcaData();
    fetchPoliticalParties();
    fetchElections();
  }, []);

  const fetchMpcaData = async () => {
    try {
      const { data, error } = await supabase
        .from('mpca')
        .select('*')
        .order('municipio');

      if (error) throw error;
      setMpcaData(data || []);
    } catch (error) {
      console.error('Error fetching MPCA data:', error);
    }
  };

  const fetchPoliticalParties = async () => {
    try {
      const { data, error } = await supabase
        .from('political_parties')
        .select('*')
        .order('siglas');

      if (error) throw error;
      setPoliticalParties(data || []);
    } catch (error) {
      console.error('Error fetching political parties:', error);
    }
  };

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  return {
    mpcaData,
    politicalParties,
    elections
  };
};
