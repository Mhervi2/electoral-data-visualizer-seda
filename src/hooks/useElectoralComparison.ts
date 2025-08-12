import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ElectionOption {
  id: string;
  name: string;
}

export interface PartyComparisonData {
  party_id: string;
  party_name: string;
  party_color: string;
  elections: {
    [electionId: string]: {
      votes: number;
      percentage: number;
    };
  };
}

export interface ComparisonFilters {
  electionIds: string[];
  autonomousCommunity?: string;
  province?: string;
  municipality?: string;
  district?: string;
  section?: string;
  table?: string;
  sourceTypes: string[];
}

export const useElectoralComparison = () => {
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<PartyComparisonData[]>([]);
  const [selectedElections, setSelectedElections] = useState<ElectionOption[]>([]);
  const { toast } = useToast();

  const fetchComparisonData = async (filters: ComparisonFilters) => {
    if (filters.electionIds.length === 0) {
      setComparisonData([]);
      return;
    }

    setLoading(true);
    try {
      // Build base query for electoral acts
      let query = supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          election_id,
          municipality_idm,
          mesa_identifier,
          total_voters,
          id
        `)
        .in('election_id', filters.electionIds);

      // Apply location filters
      if (filters.autonomousCommunity) {
        query = query.eq('comunidad_autonoma', filters.autonomousCommunity);
      }
      if (filters.province) {
        query = query.eq('provincia', filters.province);
      }
      if (filters.municipality) {
        query = query.eq('municipio', filters.municipality);
      }

      // Apply source type filters
      if (filters.sourceTypes.length > 0) {
        query = query.in('source_type', filters.sourceTypes);
      }

      const { data: acts, error } = await query;

      if (error) throw error;

      // Get party votes for these acts
      if (!acts || acts.length === 0) {
        setComparisonData([]);
        return;
      }

      const actIds = acts.map(act => act.id);
      
      const { data: partyVotes, error: partyError } = await supabase
        .from('party_votes')
        .select(`
          electoral_act_id,
          party_id,
          votes,
          political_parties:political_parties(
            id,
            name,
            color
          )
        `)
        .in('electoral_act_id', actIds);

      if (partyError) throw partyError;

      // Process the data to aggregate by party and election
      const partyData: { [partyId: string]: PartyComparisonData } = {};
      const electionTotals: { [electionId: string]: number } = {};

      // Calculate totals per election
      partyVotes?.forEach(pv => {
        const act = acts.find(a => a.id === pv.electoral_act_id);
        if (act) {
          if (!electionTotals[act.election_id]) {
            electionTotals[act.election_id] = 0;
          }
          electionTotals[act.election_id] += pv.votes;
        }
      });

      // Aggregate party votes
      partyVotes?.forEach(pv => {
        const act = acts.find(a => a.id === pv.electoral_act_id);
        if (!act) return;

        const partyId = pv.party_id;
        const party = pv.political_parties;
        
        if (!partyData[partyId]) {
          partyData[partyId] = {
            party_id: partyId,
            party_name: party.name,
            party_color: party.color,
            elections: {}
          };
        }

        if (!partyData[partyId].elections[act.election_id]) {
          partyData[partyId].elections[act.election_id] = {
            votes: 0,
            percentage: 0
          };
        }

        partyData[partyId].elections[act.election_id].votes += pv.votes;
      });

      // Calculate percentages
      Object.values(partyData).forEach(party => {
        Object.keys(party.elections).forEach(electionId => {
          const totalVotes = electionTotals[electionId];
          if (totalVotes > 0) {
            party.elections[electionId].percentage = 
              (party.elections[electionId].votes / totalVotes) * 100;
          }
        });
      });

      // Sort parties by highest total votes across all elections
      const sortedParties = Object.values(partyData).sort((a, b) => {
        const totalA = Object.values(a.elections).reduce((sum, election) => sum + election.votes, 0);
        const totalB = Object.values(b.elections).reduce((sum, election) => sum + election.votes, 0);
        return totalB - totalA;
      });

      setComparisonData(sortedParties);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de comparación electoral.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    comparisonData,
    selectedElections,
    setSelectedElections,
    fetchComparisonData
  };
};