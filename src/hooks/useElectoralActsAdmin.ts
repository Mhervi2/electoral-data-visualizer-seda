import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ElectoralActAdmin {
  id: string;
  election_id: string;
  municipality_idm: number | null;
  mesa_identifier: string | null;
  census_total: number | null;
  total_voters: number | null;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  version: number;
  completion_status?: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
  party_votes: {
    id: string;
    votes: number;
    party_id: string;
    political_parties: {
      name: string;
      siglas: string;
      color: string;
    };
  }[];
  mail_votes: {
    dni: string;
  }[];
}

export interface ActAuditLog {
  id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_at: string;
  version: number;
  changed_by: string;
}

export const useElectoralActsAdmin = () => {
  const [acts, setActs] = useState<ElectoralActAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const { toast } = useToast();

  const fetchActs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('electoral_acts')
        .select(`
          *,
          mpca(
            municipio,
            provincia,
            ca
          ),
          party_votes:party_votes(
            id,
            votes,
            party_id,
            political_parties:political_parties(name, siglas, color)
          ),
          mail_votes:mail_votes(dni)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('mesa_identifier', `%${searchTerm}%`);
      }

      if (municipalityFilter) {
        query = query.ilike('municipio', `%${municipalityFilter}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching acts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas."
        });
        return;
      }

      // Map the data to include municipality information
      const mappedData = (data || []).map(act => ({
        ...act,
        municipio: act.mpca?.municipio || 'Sin municipio',
        provincia: act.mpca?.provincia || 'Sin provincia',
        comunidad_autonoma: act.mpca?.ca || 'Sin comunidad autónoma'
      }));

      setActs(mappedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al cargar las actas."
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAct = async (actId: string, updates: Partial<ElectoralActAdmin>) => {
    try {
      const { error } = await supabase
        .from('electoral_acts')
        .update(updates)
        .eq('id', actId);

      if (error) {
        console.error('Error updating act:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el acta."
        });
        return false;
      }

      toast({
        title: "Éxito",
        description: "Acta actualizada correctamente."
      });

      // Refresh the list
      await fetchActs();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al actualizar el acta."
      });
      return false;
    }
  };

  const updatePartyVotes = async (actId: string, partyVotes: { party_id: string; votes: number }[]) => {
    try {
      // Get current party votes
      const { data: currentVotes, error: fetchError } = await supabase
        .from('party_votes')
        .select('party_id, votes')
        .eq('electoral_act_id', actId);

      if (fetchError) {
        console.error('Error fetching current party votes:', fetchError);
        return false;
      }

      const currentVotesMap = new Map(
        (currentVotes || []).map(pv => [pv.party_id, pv.votes])
      );
      const newVotesMap = new Map(
        partyVotes.map(pv => [pv.party_id, pv.votes])
      );

      // Find changes
      const toUpdate: { party_id: string; votes: number }[] = [];
      const toInsert: { party_id: string; votes: number }[] = [];
      const toDelete: string[] = [];

      // Check for updates and inserts
      for (const [partyId, newVotes] of newVotesMap) {
        const currentVotes = currentVotesMap.get(partyId);
        if (currentVotes === undefined) {
          // New party
          toInsert.push({ party_id: partyId, votes: newVotes });
        } else if (currentVotes !== newVotes) {
          // Updated votes
          toUpdate.push({ party_id: partyId, votes: newVotes });
        }
      }

      // Check for deletions
      for (const [partyId] of currentVotesMap) {
        if (!newVotesMap.has(partyId)) {
          toDelete.push(partyId);
        }
      }

      // Execute changes
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('party_votes')
          .delete()
          .eq('electoral_act_id', actId)
          .in('party_id', toDelete);

        if (deleteError) {
          console.error('Error deleting party votes:', deleteError);
          return false;
        }
      }

      if (toUpdate.length > 0) {
        for (const update of toUpdate) {
          const { error: updateError } = await supabase
            .from('party_votes')
            .update({ votes: update.votes })
            .eq('electoral_act_id', actId)
            .eq('party_id', update.party_id);

          if (updateError) {
            console.error('Error updating party votes:', updateError);
            return false;
          }
        }
      }

      if (toInsert.length > 0) {
        const insertData = toInsert.map(pv => ({
          electoral_act_id: actId,
          party_id: pv.party_id,
          votes: pv.votes
        }));

        const { error: insertError } = await supabase
          .from('party_votes')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting party votes:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateMailVotes = async (actId: string, mailVotes: { dni: string }[]) => {
    try {
      // First, delete existing mail votes
      await supabase
        .from('mail_votes')
        .delete()
        .eq('electoral_act_id', actId);

      // Then insert new ones
      if (mailVotes.length > 0) {
        const mailVotesData = mailVotes.map(mv => ({
          electoral_act_id: actId,
          dni: mv.dni
        }));

        const { error } = await supabase
          .from('mail_votes')
          .insert(mailVotesData);

        if (error) {
          console.error('Error updating mail votes:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const getActAuditLog = async (actId: string): Promise<ActAuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('electoral_acts_audit_log')
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          changed_at,
          version,
          changed_by
        `)
        .eq('electoral_act_id', actId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchActs();
  }, [searchTerm, municipalityFilter]);

  return {
    acts,
    loading,
    searchTerm,
    setSearchTerm,
    municipalityFilter,
    setMunicipalityFilter,
    updateAct,
    updatePartyVotes,
    updateMailVotes,
    getActAuditLog,
    fetchActs
  };
};