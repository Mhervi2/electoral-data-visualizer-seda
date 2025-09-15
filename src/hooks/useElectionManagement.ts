import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ElectionFormData {
  name: string;
  election_date: string;
  election_type: string;
  scope: string;
  total_seats: number;
  minimum_threshold: number;
  selectedParties: string[];
  is_visible?: boolean;
}

export const useElectionManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createElection = useCallback(async (formData: ElectionFormData) => {
    try {
      setLoading(true);
      console.log('🗳️ Creating election with data:', formData);

      // Create the election
      const { data: electionData, error } = await supabase
        .from('elections')
        .insert({
          name: formData.name,
          election_date: formData.election_date,
          election_type: formData.election_type,
          scope: formData.scope,
          total_seats: formData.total_seats,
          minimum_threshold: formData.minimum_threshold,
          is_visible: formData.is_visible ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating election:', error);
        throw error;
      }

      console.log('✅ Election created:', electionData);

      // Create election-party relationships
      if (formData.selectedParties.length > 0) {
        const electionParties = formData.selectedParties.map(partyId => ({
          election_id: electionData.id,
          party_id: partyId
        }));

        const { error: partiesError } = await (supabase as any)
          .from('election_parties')
          .insert(electionParties);

        if (partiesError) {
          console.error('❌ Error linking parties to election:', partiesError);
          throw partiesError;
        }

      console.log('✅ Election parties linked:', electionParties.length);
      }

      // Initialize provincial seats for the new election
      try {
        const { error: seatsError } = await supabase.rpc('initialize_provincial_seats_for_election', {
          p_election_id: electionData.id
        });

        if (seatsError) {
          console.error('⚠️ Error initializing provincial seats:', seatsError);
          // Don't throw here - seats can be initialized later
        } else {
          console.log('✅ Provincial seats initialized');
        }
      } catch (seatsError) {
        console.error('⚠️ Non-fatal error initializing provincial seats:', seatsError);
      }

      toast({
        title: "Elección creada",
        description: `La elección "${formData.name}" ha sido creada exitosamente.`,
      });

      return electionData;

    } catch (error) {
      console.error('💥 Fatal error creating election:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la elección. Por favor, inténtalo de nuevo.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateElection = useCallback(async (electionId: string, formData: ElectionFormData) => {
    try {
      setLoading(true);
      console.log('🗳️ Updating election with data:', formData);

      // Update the election
      const { error } = await supabase
        .from('elections')
        .update({
          name: formData.name,
          election_date: formData.election_date,
          election_type: formData.election_type,
          scope: formData.scope,
          total_seats: formData.total_seats,
          minimum_threshold: formData.minimum_threshold,
          is_visible: formData.is_visible ?? true,
        })
        .eq('id', electionId);

      if (error) {
        console.error('❌ Error updating election:', error);
        throw error;
      }

      // Remove existing party relationships
      const { error: deleteError } = await (supabase as any)
        .from('election_parties')
        .delete()
        .eq('election_id', electionId);

      if (deleteError) {
        console.error('❌ Error removing old party relationships:', deleteError);
        throw deleteError;
      }

      // Create new election-party relationships
      if (formData.selectedParties.length > 0) {
        const electionParties = formData.selectedParties.map(partyId => ({
          election_id: electionId,
          party_id: partyId
        }));

        const { error: partiesError } = await (supabase as any)
          .from('election_parties')
          .insert(electionParties);

        if (partiesError) {
          console.error('❌ Error linking parties to election:', partiesError);
          throw partiesError;
        }

        console.log('✅ Election parties updated:', electionParties.length);
      }

      toast({
        title: "Elección actualizada",
        description: `La elección "${formData.name}" ha sido actualizada exitosamente.`,
      });

      return { success: true };

    } catch (error) {
      console.error('💥 Fatal error updating election:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la elección. Por favor, inténtalo de nuevo.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getElectionWithParties = useCallback(async (electionId: string) => {
    try {
      console.log('🗳️ Fetching election with parties:', electionId);

      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (electionError) {
        console.error('❌ Error fetching election:', electionError);
        throw electionError;
      }

      const { data: parties, error: partiesError } = await (supabase as any)
        .from('election_parties')
        .select('party_id')
        .eq('election_id', electionId);

      if (partiesError) {
        console.error('❌ Error fetching election parties:', partiesError);
        throw partiesError;
      }

      return {
        ...election,
        selectedParties: parties?.map((p: any) => p.party_id) || []
      };

    } catch (error) {
      console.error('💥 Fatal error fetching election:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la elección.",
      });
      throw error;
    }
  }, [toast]);

  return {
    createElection,
    updateElection,
    getElectionWithParties,
    loading
  };
};