import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartyProvince {
  id: string;
  party_id: string;
  provincia: string;
  is_available: boolean;
}

export const usePartyProvinces = (partyId?: string) => {
  const { toast } = useToast();
  const [partyProvinces, setPartyProvinces] = useState<PartyProvince[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPartyProvinces = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('party_provinces')
        .select('*');
      
      if (partyId) {
        query = query.eq('party_id', partyId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching party provinces:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las configuraciones de provincias.",
        });
        return;
      }
      
      setPartyProvinces(data || []);
    } catch (error) {
      console.error('Error in fetchPartyProvinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePartyProvince = async (partyId: string, provincia: string, isAvailable: boolean) => {
    try {
      setUpdating(true);
      
      const { data, error } = await supabase
        .from('party_provinces')
        .upsert({
          party_id: partyId,
          provincia,
          is_available: isAvailable
        });

      if (error) {
        console.error('Error updating party province:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar la configuración de provincia.",
        });
        return false;
      }

      await fetchPartyProvinces();
      return true;
    } catch (error) {
      console.error('Error in updatePartyProvince:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const setPartyForAllProvinces = async (partyId: string, provincias: string[], isAvailable: boolean) => {
    try {
      setUpdating(true);
      
      const updates = provincias.map(provincia => ({
        party_id: partyId,
        provincia,
        is_available: isAvailable
      }));

      const { error } = await supabase
        .from('party_provinces')
        .upsert(updates);

      if (error) {
        console.error('Error updating multiple party provinces:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron actualizar las configuraciones de provincias.",
        });
        return false;
      }

      await fetchPartyProvinces();
      toast({
        title: "Éxito",
        description: `Configuración actualizada para ${provincias.length} provincias.`,
      });
      return true;
    } catch (error) {
      console.error('Error in setPartyForAllProvinces:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const getPartyAvailability = (partyId: string, provincia: string): boolean => {
    const record = partyProvinces.find(
      pp => pp.party_id === partyId && pp.provincia === provincia
    );
    // Default to true if no record exists (party is available by default)
    return record ? record.is_available : true;
  };

  useEffect(() => {
    fetchPartyProvinces();
  }, [partyId]);

  return {
    partyProvinces,
    loading,
    updating,
    updatePartyProvince,
    setPartyForAllProvinces,
    getPartyAvailability,
    refetch: fetchPartyProvinces
  };
};