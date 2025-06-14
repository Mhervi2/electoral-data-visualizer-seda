
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
      console.log('=== STARTING DATA FETCH PROCESS ===');
      console.log('Supabase URL:', 'https://bzufsrhmxaiqnmkvketb.supabase.co');
      console.log('Auth status:', await supabase.auth.getSession());
      
      setLoading(true);
      try {
        // Fetch MPCA data first to debug the issue
        await fetchMpcaData();
        
        // Then fetch other data
        await Promise.all([
          fetchPoliticalParties(),
          fetchElections()
        ]);
      } catch (error) {
        console.error('=== CRITICAL ERROR IN fetchAllData ===', error);
      } finally {
        setLoading(false);
        console.log('=== DATA FETCH PROCESS COMPLETED ===');
      }
    };
    
    fetchAllData();
  }, []);

  const fetchMpcaData = async () => {
    try {
      console.log('=== MPCA FETCH START ===');
      console.log('Supabase client status:', supabase ? 'EXISTS' : 'NULL');
      
      // Test basic connectivity first
      const { data: testData, error: testError } = await supabase
        .from('mpca')
        .select('count')
        .limit(1);
        
      console.log('Test query result:', { testData, testError });
      
      if (testError) {
        console.error('=== TEST QUERY FAILED ===');
        console.error('Error code:', testError.code);
        console.error('Error message:', testError.message);
        console.error('Error details:', testError.details);
        console.error('Error hint:', testError.hint);
        setMpcaData([]);
        return;
      }

      // If test passes, fetch actual data
      console.log('Test query successful, fetching full data...');
      const { data, error } = await supabase
        .from('mpca')
        .select('idm, municipio, idp, provincia, idca, ca')
        .order('municipio');

      console.log('=== FULL QUERY RESULTS ===');
      console.log('Error:', error);
      console.log('Data length:', data?.length);
      console.log('First 5 records:', data?.slice(0, 5));

      if (error) {
        console.error('=== MPCA QUERY ERROR ===');
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setMpcaData([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('=== NO MPCA DATA FOUND ===');
        setMpcaData([]);
        return;
      }
      
      console.log('=== MPCA DATA SUCCESS ===');
      console.log('Total municipalities loaded:', data.length);
      
      // Test Barcelona specifically
      const barcelona = data.find(m => 
        m.municipio && m.municipio.toLowerCase().includes('barcelona')
      );
      console.log('Barcelona found:', barcelona);
      
      setMpcaData(data);
    } catch (error) {
      console.error('=== MPCA FETCH EXCEPTION ===', error);
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
