import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProvincialSeat {
  id: string;
  provincia: string;
  seats: number;
  election_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProvincialSeats = (electionId?: string) => {
  const [provincialSeats, setProvincialSeats] = useState<ProvincialSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProvincialSeats = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('provincial_seats')
        .select('*')
        .order('provincia');

      if (electionId) {
        query = query.eq('election_id', electionId);
      } else {
        query = query.is('election_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProvincialSeats(data || []);
    } catch (error) {
      console.error('Error fetching provincial seats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los escaños provinciales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProvincialSeat = async (provincia: string, seats: number, electionId?: string) => {
    try {
      const { error } = await supabase
        .from('provincial_seats')
        .upsert({
          provincia,
          seats,
          election_id: electionId || null,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Escaños actualizados para ${provincia}: ${seats}`,
      });

      fetchProvincialSeats();
    } catch (error) {
      console.error('Error updating provincial seat:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los escaños",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProvincialSeats();
  }, [electionId]);

  return {
    provincialSeats,
    loading,
    updateProvincialSeat,
    refetch: fetchProvincialSeats,
  };
};