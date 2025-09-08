
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Election {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const useElections = () => {
  const { toast } = useToast();
  const { isLoading: authLoading } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Waiting for auth to complete before fetching elections...');
      return;
    }
    const fetchElections = async () => {
      try {
        setLoading(true);
        console.log('🗳️ Fetching available elections...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session for elections fetch:', session ? 'Active' : 'None');

        const { data, error } = await supabase
          .from('elections')
          .select('id, name, status, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching elections:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las elecciones disponibles.",
          });
          return;
        }

        console.log('✅ Elections loaded:', data?.length || 0);
        setElections(data || []);

      } catch (error) {
        console.error('💥 Fatal error loading elections:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error inesperado al cargar las elecciones.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, [toast, authLoading]);

  const getActiveElection = () => {
    return elections.find(election => election.status === 'active');
  };

  return { elections, loading, getActiveElection };
};
