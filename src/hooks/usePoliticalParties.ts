import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PoliticalParty {
  id: string;
  name: string;
  siglas: string;
  color: string;
}

export const usePoliticalParties = () => {
  const { toast } = useToast();
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        console.log('🎭 Fetching political parties...');

        const { data, error } = await supabase
          .from('political_parties')
          .select('id, name, siglas, color')
          .order('name', { ascending: true });

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
  }, [toast]);

  return { parties, loading };
};