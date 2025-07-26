import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ElectoralActAdmin {
  id: string;
  election_id: string;
  municipality_idm: number;
  mesa_identifier: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  version: number;
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
          party_votes:party_votes(
            id,
            votes,
            party_id,
            political_parties:political_parties(name, siglas, color)
          ),
          mail_votes:mail_votes(dni)
        `)
        .eq('source_type', 'user')
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

      setActs(data || []);
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
      // First, delete existing party votes
      await supabase
        .from('party_votes')
        .delete()
        .eq('electoral_act_id', actId);

      // Then insert new ones
      const partyVotesData = partyVotes.map(pv => ({
        electoral_act_id: actId,
        party_id: pv.party_id,
        votes: pv.votes
      }));

      const { error } = await supabase
        .from('party_votes')
        .insert(partyVotesData);

      if (error) {
        console.error('Error updating party votes:', error);
        return false;
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