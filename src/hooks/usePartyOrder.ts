import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PoliticalParty } from '@/types/acta';

export const usePartyOrder = (provincia: string | undefined, parties: PoliticalParty[]) => {
  const [orderedParties, setOrderedParties] = useState<PoliticalParty[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!provincia || parties.length === 0) {
      setOrderedParties(parties);
      setLoading(false);
      return;
    }

    loadPartyOrder();
  }, [provincia, parties]);

  const loadPartyOrder = async () => {
    try {
      setLoading(true);
      
      // Query the table directly using SQL
      const { data: orderData, error } = await supabase
        .from('political_party_provincial_order' as any)
        .select('party_id, order_position')
        .eq('provincia', provincia)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Error loading party order:', error);
        setOrderedParties(parties);
        return;
      }

      if (!orderData || orderData.length === 0) {
        // No custom order exists, use default order
        setOrderedParties(parties);
        return;
      }

      // Create order map
      const orderMap = new Map(orderData.map((item: any) => [item.party_id, item.order_position]));
      
      // Sort parties based on saved order, put unordered parties at the end
      const sorted = [...parties].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      setOrderedParties(sorted);
    } catch (error) {
      console.error('Fatal error loading party order:', error);
      setOrderedParties(parties);
    } finally {
      setLoading(false);
    }
  };

  const savePartyOrder = async (newOrder: PoliticalParty[]) => {
    if (!provincia) return;

    try {
      // Delete existing order for this province
      await supabase
        .from('political_party_provincial_order' as any)
        .delete()
        .eq('provincia', provincia);

      // Insert new order
      const orderData = newOrder.map((party, index) => ({
        provincia,
        party_id: party.id,
        order_position: index + 1
      }));

      const { error } = await supabase
        .from('political_party_provincial_order' as any)
        .insert(orderData);

      if (error) {
        console.error('Error saving party order:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el orden de partidos.",
        });
        return;
      }

      console.log(`✅ Party order saved for province: ${provincia}`);
    } catch (error) {
      console.error('Fatal error saving party order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al guardar el orden de partidos.",
      });
    }
  };

  const updatePartyOrder = (newOrder: PoliticalParty[]) => {
    setOrderedParties(newOrder);
    savePartyOrder(newOrder);
  };

  return {
    orderedParties,
    loading,
    updatePartyOrder
  };
};