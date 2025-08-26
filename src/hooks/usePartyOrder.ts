import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PoliticalParty } from '@/types/acta';
import { usePartyProvinces } from './usePartyProvinces';

export const usePartyOrder = (provincia: string | undefined, parties: PoliticalParty[]) => {
  const [orderedParties, setOrderedParties] = useState<PoliticalParty[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getPartyAvailability } = usePartyProvinces();

  useEffect(() => {
    console.log('🎭 usePartyOrder effect triggered:', { provincia, partiesLength: parties.length });
    
    if (parties.length === 0) {
      console.log('🎭 No parties available yet, waiting...');
      setOrderedParties([]);
      setLoading(true);
      return;
    }

    if (!provincia) {
      console.log('🎭 No provincia provided, using default order');
      setOrderedParties(parties);
      setLoading(false);
      return;
    }

    console.log(`🎭 Loading party order for provincia: ${provincia}`);
    loadPartyOrder();
  }, [provincia, parties]);

  const loadPartyOrder = async () => {
    try {
      setLoading(true);
      console.log(`🎭 Starting loadPartyOrder for provincia: ${provincia} with ${parties.length} parties`);
      
      // Query the table directly using SQL
      const { data: orderData, error } = await supabase
        .from('political_party_provincial_order')
        .select('party_id, order_position')
        .eq('provincia', provincia)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('❌ Error loading party order:', error);
        setOrderedParties(parties);
        return;
      }

      console.log(`🎭 Retrieved order data:`, orderData);

      if (!orderData || orderData.length === 0) {
        console.log('🎭 No custom order exists, using default order');
        // Filter parties by province availability even with default order
        const availableParties = parties.filter(party => 
          !provincia || getPartyAvailability(party.id, provincia)
        );
        console.log('🎭 Available parties for provincia', provincia, ':', availableParties.map(p => p.siglas));
        setOrderedParties(availableParties);
        return;
      }

      // Create order map
      const orderMap = new Map(orderData.map((item: any) => [item.party_id, item.order_position]));
      console.log('🎭 Order map:', Array.from(orderMap.entries()));
      
      // Filter parties by province availability first
      const availableParties = parties.filter(party => 
        !provincia || getPartyAvailability(party.id, provincia)
      );
      
      console.log('🎭 Available parties for provincia', provincia, ':', availableParties.map(p => p.siglas));

      // Sort parties based on saved order, put unordered parties at the end
      const sorted = [...availableParties].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      console.log('🎭 Sorted available parties:', sorted.map(p => ({ id: p.id, siglas: p.siglas, order: orderMap.get(p.id) })));
      setOrderedParties(sorted);
    } catch (error) {
      console.error('💥 Fatal error loading party order:', error);
      setOrderedParties(parties);
    } finally {
      setLoading(false);
    }
  };

  const savePartyOrder = async (newOrder: PoliticalParty[]) => {
    if (!provincia) {
      console.warn('🎭 No provincia provided for saving party order');
      return;
    }

    try {
      console.log(`🎭 Saving party order for provincia: ${provincia}`);
      
      // Use upsert instead of delete + insert for better reliability
      const orderData = newOrder.map((party, index) => ({
        provincia,
        party_id: party.id,
        order_position: index + 1
      }));

      // First, delete existing records for this province
      const { error: deleteError } = await supabase
        .from('political_party_provincial_order')
        .delete()
        .eq('provincia', provincia);

      if (deleteError) {
        console.error('❌ Error deleting existing party order:', deleteError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al eliminar orden existente: ${deleteError.message}`,
        });
        return;
      }

      // Then insert new order
      const { error: insertError } = await supabase
        .from('political_party_provincial_order')
        .insert(orderData);

      if (insertError) {
        console.error('❌ Error inserting party order:', insertError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al guardar el orden: ${insertError.message}`,
        });
        return;
      }

      console.log(`✅ Party order saved successfully for province: ${provincia}`);
      toast({
        title: "Éxito",
        description: "Orden de partidos guardado correctamente.",
      });
    } catch (error) {
      console.error('💥 Fatal error saving party order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al guardar el orden de partidos.",
      });
    }
  };

  const updatePartyOrder = (newOrder: PoliticalParty[]) => {
    console.log('🎭 Updating party order:', newOrder.map(p => ({ id: p.id, siglas: p.siglas })));
    setOrderedParties(newOrder);
    savePartyOrder(newOrder);
  };

  return {
    orderedParties,
    loading,
    updatePartyOrder
  };
};