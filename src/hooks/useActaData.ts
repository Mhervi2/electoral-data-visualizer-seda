
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
      console.log('Fetching MPCA data...');
      console.log('Supabase client:', supabase);
      
      // First, let's try a simple count query
      const { count, error: countError } = await supabase
        .from('mpca')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total records in mpca table:', count);
      if (countError) {
        console.error('Count error:', countError);
      }

      // Now try to fetch all data without ordering first
      const { data, error } = await supabase
        .from('mpca')
        .select('idm, municipio, idp, provincia, idca, ca');

      console.log('Raw query result:', { data, error });
      
      if (error) {
        console.error('Error fetching MPCA data:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setMpcaData([]);
        return;
      }
      
      console.log('MPCA data fetched successfully:', data?.length, 'municipalities');
      console.log('First few items:', data?.slice(0, 5));
      
      // Sort the data after fetching to avoid potential database issues
      const sortedData = data?.sort((a, b) => a.municipio?.localeCompare(b.municipio || '') || 0) || [];
      console.log('Sorted data length:', sortedData.length);
      
      setMpcaData(sortedData);
    } catch (error) {
      console.error('Error in fetchMpcaData:', error);
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
