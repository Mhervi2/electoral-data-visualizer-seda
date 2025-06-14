
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
      console.log('Starting to fetch all data...');
      setLoading(true);
      try {
        await Promise.all([
          fetchMpcaData(),
          fetchPoliticalParties(),
          fetchElections()
        ]);
      } catch (error) {
        console.error('Error in fetchAllData:', error);
      } finally {
        setLoading(false);
        console.log('Finished fetching all data');
      }
    };
    
    fetchAllData();
  }, []);

  const fetchMpcaData = async () => {
    try {
      console.log('=== STARTING MPCA DATA FETCH ===');
      console.log('Supabase client:', supabase);
      
      const { data, error } = await supabase
        .from('mpca')
        .select('*')
        .order('municipio');

      console.log('MPCA Query result - error:', error);
      console.log('MPCA Query result - data:', data);

      if (error) {
        console.error('Error fetching MPCA data:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('MPCA data fetched successfully:', data?.length, 'municipalities');
      console.log('Sample MPCA data:', data?.slice(0, 3));
      
      // Check if Barcelona exists in the data
      const barcelona = data?.find(m => m.municipio?.toLowerCase().includes('barcelona'));
      console.log('Barcelona found in data:', barcelona);
      
      setMpcaData(data || []);
    } catch (error) {
      console.error('Exception in fetchMpcaData:', error);
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
