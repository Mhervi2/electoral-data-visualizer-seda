import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface PoliticalParty {
  id: string;
  name: string;
  siglas: string;
  color: string;
  party_identifier: number;
}

export const usePoliticalParties = () => {
  const { toast } = useToast();
  const { isLoading: authLoading } = useAuth();
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Waiting for auth to complete before fetching parties...');
      return;
    }
    const fetchParties = async () => {
      try {
        setLoading(true);
        console.log('🎭 Fetching political parties...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session for parties fetch:', session ? 'Active' : 'None');

        const { data, error } = await supabase
          .from('political_parties')
          .select('id, name, siglas, color, party_identifier')
          .order('party_identifier', { ascending: true });

        if (error) {
          console.error('❌ Error fetching political parties:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los partidos políticos.",
          });
          return;
        }

        console.log('✅ Political parties loaded:', data?.length || 0);
        setParties(data || []);

      } catch (error) {
        console.error('💥 Fatal error loading political parties:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error inesperado al cargar los partidos políticos.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [toast, authLoading]);

  return { parties, loading };
};