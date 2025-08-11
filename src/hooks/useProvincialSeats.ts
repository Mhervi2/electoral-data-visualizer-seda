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
      
      // Get existing provincial seats for the selected election
      let query = supabase
        .from('provincial_seats')
        .select('*')
        .order('provincia');

      if (electionId) {
        query = query.eq('election_id', electionId);
      } else {
        query = query.is('election_id', null);
      }

      const { data: seatsData, error: seatsError } = await query;
      if (seatsError) throw seatsError;

      // If no data exists for this election, initialize it
      if (electionId && (!seatsData || seatsData.length === 0)) {
        await initializeProvincialSeats(electionId);
        // Refetch after initialization
        const { data: newSeatsData, error: newSeatsError } = await supabase
          .from('provincial_seats')
          .select('*')
          .eq('election_id', electionId)
          .order('provincia');
        
        if (newSeatsError) throw newSeatsError;
        setProvincialSeats(newSeatsData || []);
      } else {
        setProvincialSeats(seatsData || []);
      }
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

  const initializeProvincialSeats = async (electionId: string) => {
    try {
      const { error } = await supabase.rpc('initialize_provincial_seats_for_election', {
        p_election_id: electionId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Escaños provinciales inicializados con valores por defecto",
      });
    } catch (error) {
      console.error('Error initializing provincial seats:', error);
      toast({
        title: "Error",
        description: "No se pudieron inicializar los escaños provinciales",
        variant: "destructive",
      });
    }
  };

  // Default seats based on 2019 election distribution
  const getDefaultSeats = (provincia: string): number => {
    const defaultSeats: Record<string, number> = {
      'Madrid': 37, 'Barcelona': 32, 'Valencia': 16, 'Sevilla': 12, 'Alicante': 12,
      'Murcia': 10, 'Cádiz': 9, 'Baleares': 8, 'Córdoba': 7, 'Santa Cruz de Tenerife': 7,
      'Las Palmas': 7, 'Málaga': 11, 'Vizcaya': 8, 'Asturias': 8, 'La Coruña': 8,
      'Pontevedra': 7, 'Cantabria': 5, 'Gipuzkoa': 6, 'Tarragona': 6, 'Girona': 6,
      'Lleida': 4, 'Castellón': 5, 'Almería': 6, 'Ciudad Real': 5, 'Badajoz': 6,
      'Huelva': 5, 'Jaén': 6, 'Granada': 7, 'Cáceres': 4, 'Toledo': 6,
      'Albacete': 4, 'Cuenca': 3, 'Guadalajara': 3, 'Álava': 4, 'La Rioja': 4,
      'Navarra': 5, 'Huesca': 3, 'Teruel': 3, 'Zaragoza': 7, 'Zamora': 3,
      'Salamanca': 4, 'Ávila': 3, 'Segovia': 3, 'Soria': 2, 'Valladolid': 5,
      'Palencia': 3, 'Burgos': 4, 'León': 4, 'Lugo': 4, 'Ourense': 4,
      'Ceuta': 1, 'Melilla': 1
    };
    return defaultSeats[provincia] || 3;
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

  const copyProvincialSeats = async (fromElectionId: string, toElectionId: string) => {
    try {
      const { error } = await supabase.rpc('copy_provincial_seats_between_elections', {
        p_from_election_id: fromElectionId,
        p_to_election_id: toElectionId
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Escaños copiados correctamente",
      });

      fetchProvincialSeats();
    } catch (error) {
      console.error('Error copying provincial seats:', error);
      toast({
        title: "Error",
        description: "No se pudieron copiar los escaños",
        variant: "destructive",
      });
    }
  };

  return {
    provincialSeats,
    loading,
    updateProvincialSeat,
    initializeProvincialSeats,
    copyProvincialSeats,
    refetch: fetchProvincialSeats,
  };
};