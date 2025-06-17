
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartyResultBySource {
  party: {
    name: string;
    siglas: string;
    color: string;
  };
  totalVotes: number;
  percentage: number;
  sourceResults: {
    [sourceType: string]: {
      votes: number;
      percentage: number;
    };
  };
}

interface ElectoralAct {
  id: string;
  municipality_idm: number;
  district: string;
  section: string;
  table_letter: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
}

interface AggregatedResults {
  totalVotes: number;
  totalCensus: number;
  participation: number;
  blankVotes: number;
  nullVotes: number;
  validVotes: number;
  partyResults: PartyResultBySource[];
  sourceComparison: {
    source: string;
    totalVotes: number;
    coverage: number;
  }[];
  selectedSources: string[];
  individualActas: ElectoralAct[];
}

interface Filters {
  autonomousCommunity: string;
  province: string;
  municipality: string;
  district: string;
  section: string;
  table: string;
  sourceTypes: string[];
}

export const useElectoralAggregation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null);
  const [filters, setFilters] = useState<Filters>({
    autonomousCommunity: '',
    province: '',
    municipality: '',
    district: '',
    section: '',
    table: '',
    sourceTypes: ['user', 'indra', 'escrutinio', 'oficial']
  });

  const buildQuery = (baseQuery: any) => {
    let query = baseQuery;

    // Apply hierarchical filters using the correct column names
    if (filters.autonomousCommunity.trim()) {
      query = query.ilike('comunidad_autonoma', `%${filters.autonomousCommunity.trim()}%`);
    }
    if (filters.province.trim()) {
      query = query.ilike('provincia', `%${filters.province.trim()}%`);
    }
    if (filters.municipality.trim()) {
      query = query.ilike('municipio', `%${filters.municipality.trim()}%`);
    }
    if (filters.district.trim()) {
      query = query.eq('district', filters.district.trim());
    }
    if (filters.section.trim()) {
      query = query.eq('section', filters.section.trim());
    }
    if (filters.table.trim()) {
      query = query.eq('table_letter', filters.table.trim());
    }
    if (filters.sourceTypes.length > 0) {
      query = query.in('source_type', filters.sourceTypes);
    }

    return query;
  };

  const fetchAggregatedResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching aggregated results with filters:', filters);

      // Build the query for individual actas first
      let individualQuery = supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          id,
          municipality_idm,
          district,
          section,
          table_letter,
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          source_type,
          image_url,
          created_at,
          municipio,
          provincia,
          comunidad_autonoma
        `)
        .order('created_at', { ascending: false });

      individualQuery = buildQuery(individualQuery);

      const { data: individualActas, error: individualError } = await individualQuery;

      if (individualError) {
        console.error('Error fetching individual actas:', individualError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas individuales.",
        });
        return;
      }

      console.log('Individual actas loaded:', individualActas?.length || 0);

      // Now fetch the party votes for aggregation
      let partyVotesQuery = supabase
        .from('party_votes')
        .select(`
          votes,
          political_parties (
            name,
            siglas,
            color
          ),
          electoral_act_id
        `);

      const { data: allPartyVotes, error: partyVotesError } = await partyVotesQuery;

      if (partyVotesError) {
        console.error('Error fetching party votes:', partyVotesError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los votos de partidos.",
        });
        return;
      }

      console.log('Party votes loaded:', allPartyVotes?.length || 0);

      // Filter party votes to match our electoral acts
      const actIds = new Set(individualActas?.map(act => act.id) || []);
      const filteredPartyVotes = allPartyVotes?.filter(pv => actIds.has(pv.electoral_act_id)) || [];

      // Build acts with party votes for aggregation
      const actsWithPartyVotes = (individualActas || []).map(act => ({
        ...act,
        party_votes: filteredPartyVotes
          .filter(pv => pv.electoral_act_id === act.id)
          .map(pv => ({
            votes: pv.votes,
            political_parties: pv.political_parties
          }))
      }));

      console.log('Acts with party votes:', actsWithPartyVotes.length);

      // Aggregate the results
      const aggregated = aggregateElectoralData(actsWithPartyVotes, individualActas || []);
      setAggregatedResults(aggregated);

    } catch (error) {
      console.error('Error fetching aggregated results:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar los resultados electorales.",
      });
    } finally {
      setLoading(false);
    }
  };

  const aggregateElectoralData = (acts: any[], individualActas: ElectoralAct[]): AggregatedResults => {
    const totalCensus = acts.reduce((sum, act) => sum + (act.census_total || 0), 0);
    const totalVotes = acts.reduce((sum, act) => sum + (act.total_voters || 0), 0);
    const blankVotes = acts.reduce((sum, act) => sum + (act.blank_votes || 0), 0);
    const nullVotes = acts.reduce((sum, act) => sum + (act.null_votes || 0), 0);
    const validVotes = totalVotes - blankVotes - nullVotes;
    const participation = totalCensus > 0 ? (totalVotes / totalCensus) * 100 : 0;

    // Aggregate party votes by source
    const partyVotesMap = new Map<string, { party: any; sourceResults: Map<string, number>; totalVotes: number }>();
    
    acts.forEach(act => {
      if (act.party_votes && Array.isArray(act.party_votes)) {
        act.party_votes.forEach((pv: any) => {
          if (pv.political_parties) {
            const partyKey = pv.political_parties.siglas;
            const sourceType = act.source_type || 'unknown';
            const votes = pv.votes || 0;
            
            const existing = partyVotesMap.get(partyKey);
            if (existing) {
              existing.totalVotes += votes;
              const currentSourceVotes = existing.sourceResults.get(sourceType) || 0;
              existing.sourceResults.set(sourceType, currentSourceVotes + votes);
            } else {
              const sourceResults = new Map<string, number>();
              sourceResults.set(sourceType, votes);
              partyVotesMap.set(partyKey, {
                party: pv.political_parties,
                sourceResults,
                totalVotes: votes
              });
            }
          }
        });
      }
    });

    // Calculate valid votes by source for percentage calculations
    const validVotesBySource = new Map<string, number>();
    filters.sourceTypes.forEach(sourceType => {
      const sourceValidVotes = acts
        .filter(act => act.source_type === sourceType)
        .reduce((sum, act) => sum + (act.total_voters - act.blank_votes - act.null_votes), 0);
      validVotesBySource.set(sourceType, sourceValidVotes);
    });

    const partyResults: PartyResultBySource[] = Array.from(partyVotesMap.values())
      .map(({ party, sourceResults, totalVotes }) => {
        const sourceResultsObj: { [sourceType: string]: { votes: number; percentage: number } } = {};
        
        filters.sourceTypes.forEach(sourceType => {
          const votes = sourceResults.get(sourceType) || 0;
          const sourceValidVotes = validVotesBySource.get(sourceType) || 0;
          const percentage = sourceValidVotes > 0 ? (votes / sourceValidVotes) * 100 : 0;
          
          sourceResultsObj[sourceType] = { votes, percentage };
        });

        return {
          party,
          totalVotes,
          percentage: validVotes > 0 ? (totalVotes / validVotes) * 100 : 0,
          sourceResults: sourceResultsObj
        };
      })
      .sort((a, b) => b.totalVotes - a.totalVotes);

    // Source comparison
    const sourceMap = new Map<string, { totalVotes: number; count: number }>();
    acts.forEach(act => {
      const source = act.source_type || 'unknown';
      const existing = sourceMap.get(source);
      if (existing) {
        existing.totalVotes += act.total_voters || 0;
        existing.count += 1;
      } else {
        sourceMap.set(source, { totalVotes: act.total_voters || 0, count: 1 });
      }
    });

    const sourceComparison = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      totalVotes: data.totalVotes,
      coverage: acts.length > 0 ? (data.count / acts.length) * 100 : 0
    }));

    console.log('Aggregated results:', {
      totalVotes,
      totalCensus,
      partyResults: partyResults.length,
      individualActas: individualActas.length
    });

    return {
      totalVotes,
      totalCensus,
      participation,
      blankVotes,
      nullVotes,
      validVotes,
      partyResults,
      sourceComparison,
      selectedSources: filters.sourceTypes,
      individualActas
    };
  };

  useEffect(() => {
    fetchAggregatedResults();
  }, [filters.autonomousCommunity, filters.province, filters.municipality, filters.district, filters.section, filters.table, filters.sourceTypes]);

  return {
    aggregatedResults,
    loading,
    filters,
    setFilters,
    refetch: fetchAggregatedResults
  };
};
