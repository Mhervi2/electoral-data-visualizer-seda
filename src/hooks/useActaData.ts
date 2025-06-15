
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
      console.log('Supabase client initialized:', !!supabase);
      
      // Test connection with a simple query first
      const { data: testData, error: testError } = await supabase
        .from('mpca')
        .select('count(*)', { count: 'exact' });
      
      console.log('Connection test result:', { testData, testError });

      // Try different approaches to fetch data
      let data, error;
      
      // First attempt: basic select
      const result1 = await supabase
        .from('mpca')
        .select('*')
        .limit(10);
        
      console.log('Basic select (limit 10):', result1);
      
      if (result1.error) {
        console.error('Basic select failed:', result1.error);
        
        // Second attempt: try with specific columns
        const result2 = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca')
          .limit(10);
          
        console.log('Column select (limit 10):', result2);
        data = result2.data;
        error = result2.error;
      } else {
        // If basic select worked, get all data
        const fullResult = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca');
          
        data = fullResult.data;
        error = fullResult.error;
        console.log('Full data fetch result:', { dataLength: data?.length, error });
      }

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
      
      if (!data || data.length === 0) {
        console.warn('No MPCA data returned from database');
        setMpcaData([]);
        return;
      }
      
      console.log('MPCA data fetched successfully:', data.length, 'municipalities');
      console.log('Sample data:', data.slice(0, 3));
      
      // Validate and clean the data
      const validData = data.filter(item => item.idm && item.municipio).map(item => ({
        idm: Number(item.idm),
        municipio: item.municipio || '',
        idp: Number(item.idp) || 0,
        provincia: item.provincia || '',
        idca: Number(item.idca) || 0,
        ca: item.ca || ''
      }));
      
      console.log('Valid data after filtering:', validData.length);
      
      // Sort the data
      const sortedData = validData.sort((a, b) => 
        a.municipio.localeCompare(b.municipio, 'es', { sensitivity: 'base' })
      );
      
      setMpcaData(sortedData);
    } catch (error) {
      console.error('Exception in fetchMpcaData:', error);
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
