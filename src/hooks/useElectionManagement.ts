import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ElectionFormData {
  name: string;
  election_date: string;
  election_type: string;
  scope: string;
  total_seats: number;
  selectedParties: string[];
}

export const useElectionManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createElection = useCallback(async (formData: ElectionFormData) => {
    try {
      setLoading(true);
      console.log('🗳️ Creating election with data:', formData);

      // Create the election
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .insert({
          name: formData.name,
          election_date: formData.election_date,
          election_type: formData.election_type,
          scope: formData.scope,
          total_seats: formData.total_seats,
          status: 'active'
        })
        .select()
        .single();

      if (electionError) {
        console.error('❌ Error creating election:', electionError);
        throw electionError;
      }

      console.log('✅ Election created:', election);

      // Create election-party relationships
      if (formData.selectedParties.length > 0) {
        const electionParties = formData.selectedParties.map(partyId => ({
          election_id: election.id,
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

      toast({
        title: "Elección creada",
        description: `La elección "${formData.name}" ha sido creada exitosamente.`,
      });

      return election;

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
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .update({
          name: formData.name,
          election_date: formData.election_date,
          election_type: formData.election_type,
          scope: formData.scope,
          total_seats: formData.total_seats
        })
        .eq('id', electionId)
        .select()
        .single();

      if (electionError) {
        console.error('❌ Error updating election:', electionError);
        throw electionError;
      }

      console.log('✅ Election updated:', election);

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

      return election;

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