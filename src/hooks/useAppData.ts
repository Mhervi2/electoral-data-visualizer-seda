
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';
import { useAuth } from '@/context/AuthContext';

interface AppData {
  mpcaData: MpcaData[];
  politicalParties: PoliticalParty[];
  elections: Election[];
  loading: boolean;
  error: string | null;
}

export const useAppData = () => {
  const { isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AppData>({
    mpcaData: [],
    politicalParties: [],
    elections: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Don't fetch data until auth is ready
    if (authLoading) {
      console.log('⏳ Waiting for auth to complete...');
      return;
    }

    const fetchAllData = async () => {
      console.log('🔄 Fetching all data from new database structure...');
      
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch all data in parallel
        const [mpcaResult, partiesResult, electionsResult] = await Promise.allSettled([
          supabase
            .from('mpca')
            .select('idm, municipio, provincia, ca, idca, idp, idc')
            .order('municipio'),
          
          supabase
            .from('political_parties')
            .select('id, name, siglas, color, party_identifier')
            .order('party_identifier'),
          
          supabase
            .from('elections')
            .select('id, name, status')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
        ]);

        // Process MPCA data
        let mpcaData: MpcaData[] = [];
        if (mpcaResult.status === 'fulfilled' && mpcaResult.value.data) {
          mpcaData = mpcaResult.value.data;
          console.log(`✅ MPCA data loaded: ${mpcaData.length} municipalities`);
        } else {
          console.error('❌ MPCA data failed:', mpcaResult.status === 'rejected' ? mpcaResult.reason : 'No data');
        }

        // Process Political Parties data
        let politicalParties: PoliticalParty[] = [];
        if (partiesResult.status === 'fulfilled' && partiesResult.value.data) {
          politicalParties = partiesResult.value.data.map(party => ({
            id: party.id,
            name: party.name,
            siglas: party.siglas,
            color: party.color || '#6B7280',
            party_identifier: party.party_identifier
          }));
          console.log(`✅ Political parties loaded: ${politicalParties.length} parties`);
        } else {
          console.error('❌ Political parties failed:', partiesResult.status === 'rejected' ? partiesResult.reason : 'No data');
        }

        // Process Elections data
        let elections: Election[] = [];
        if (electionsResult.status === 'fulfilled' && electionsResult.value.data) {
          elections = electionsResult.value.data.map(election => ({
            id: election.id,
            name: election.name,
            status: election.status
          }));
          console.log(`✅ Elections loaded: ${elections.length} elections`);
        } else {
          console.error('❌ Elections failed:', electionsResult.status === 'rejected' ? electionsResult.reason : 'No data');
        }

        // Update state with all data
        setData({
          mpcaData,
          politicalParties,
          elections,
          loading: false,
          error: null,
        });

        console.log('🎉 All data loaded successfully from new database!');

      } catch (error: any) {
        console.error('💥 Fatal error loading data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Error desconocido al cargar los datos'
        }));
      }
    };

    fetchAllData();
  }, [authLoading]);

  return data;
};
