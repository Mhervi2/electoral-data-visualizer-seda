
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const buildQuery = useCallback((baseQuery: any) => {
    let query = baseQuery;

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
  }, [filters]);

  const aggregateElectoralData = useCallback((acts: any[], individualActas: ElectoralAct[]): AggregatedResults => {
    const totalCensus = acts.reduce((sum, act) => sum + (Number(act.census_total) || 0), 0);
    const totalVotes = acts.reduce((sum, act) => sum + (Number(act.total_voters) || 0), 0);
    const blankVotes = acts.reduce((sum, act) => sum + (Number(act.blank_votes) || 0), 0);
    const nullVotes = acts.reduce((sum, act) => sum + (Number(act.null_votes) || 0), 0);
    const validVotes = totalVotes - blankVotes - nullVotes;
    const participation = totalCensus > 0 ? (totalVotes / totalCensus) * 100 : 0;

    const partyVotesMap = new Map<string, { party: any; sourceResults: Map<string, number>; totalVotes: number }>();
    
    acts.forEach(act => {
      if (act.party_votes && Array.isArray(act.party_votes)) {
        act.party_votes.forEach((pv: any) => {
          if (pv.political_parties) {
            const partyKey = pv.political_parties.siglas;
            const sourceType = act.source_type || 'unknown';
            const votes = Number(pv.votes) || 0;
            
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

    const validVotesBySource = new Map<string, number>();
    filters.sourceTypes.forEach(sourceType => {
      const sourceValidVotes = acts
        .filter(act => act.source_type === sourceType)
        .reduce((sum, act) => sum + (Number(act.total_voters) - Number(act.blank_votes) - Number(act.null_votes)), 0);
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

    const sourceMap = new Map<string, { totalVotes: number; count: number }>();
    acts.forEach(act => {
      const source = act.source_type || 'unknown';
      const existing = sourceMap.get(source);
      const voters = Number(act.total_voters) || 0;
      if (existing) {
        existing.totalVotes += voters;
        existing.count += 1;
      } else {
        sourceMap.set(source, { totalVotes: voters, count: 1 });
      }
    });

    const sourceComparison = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      totalVotes: data.totalVotes,
      coverage: acts.length > 0 ? (data.count / acts.length) * 100 : 0
    }));

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
  }, [filters.sourceTypes]);

  const fetchAggregatedResults = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching aggregated results with filters:', filters);

      // First get count to limit queries if needed
      let countQuery = supabase
        .from('electoral_acts_with_municipalities')
        .select('id', { count: 'exact', head: true });
      countQuery = buildQuery(countQuery);
      
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error counting acts:', countError);
        throw countError;
      }

      console.log(`Found ${count || 0} electoral acts matching filters`);

      if ((count || 0) === 0) {
        setAggregatedResults({
          totalVotes: 0,
          totalCensus: 0,
          participation: 0,
          blankVotes: 0,
          nullVotes: 0,
          validVotes: 0,
          partyResults: [],
          sourceComparison: [],
          selectedSources: filters.sourceTypes,
          individualActas: []
        });
        return;
      }

      // Limit to 1000 records for performance
      const limit = count && count > 1000 ? 1000 : undefined;
      if (limit) {
        console.log(`Limiting results to ${limit} records for performance`);
      }

      // Fetch aggregated data
      let aggregatedQuery = supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          source_type,
          party_votes (
            votes,
            political_parties (
              name,
              siglas,
              color
            )
          )
        `);

      aggregatedQuery = buildQuery(aggregatedQuery);
      if (limit) {
        aggregatedQuery = aggregatedQuery.limit(limit);
      }

      // Fetch individual acts for display
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
      individualQuery = individualQuery.limit(100); // Always limit individual acts

      const [{ data: acts, error: actsError }, { data: individualActas, error: individualError }] = await Promise.all([
        aggregatedQuery,
        individualQuery
      ]);

      if (actsError) {
        console.error('Error fetching electoral acts:', actsError);
        throw actsError;
      }

      if (individualError) {
        console.error('Error fetching individual actas:', individualError);
        throw individualError;
      }

      console.log('Acts loaded:', acts?.length || 0);
      console.log('Individual actas loaded:', individualActas?.length || 0);

      const aggregated = aggregateElectoralData(acts || [], (individualActas || []) as ElectoralAct[]);
      setAggregatedResults(aggregated);

    } catch (error: any) {
      console.error('Error fetching aggregated results:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error al cargar los resultados: ${error.message || 'Error desconocido'}`,
      });
      
      // Set empty results on error
      setAggregatedResults({
        totalVotes: 0,
        totalCensus: 0,
        participation: 0,
        blankVotes: 0,
        nullVotes: 0,
        validVotes: 0,
        partyResults: [],
        sourceComparison: [],
        selectedSources: filters.sourceTypes,
        individualActas: []
      });
    } finally {
      setLoading(false);
    }
  }, [filters, buildQuery, aggregateElectoralData, toast]);

  // Debounce filter changes to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAggregatedResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchAggregatedResults]);

  const memoizedReturn = useMemo(() => ({
    aggregatedResults,
    loading,
    filters,
    setFilters,
    refetch: fetchAggregatedResults
  }), [aggregatedResults, loading, filters, fetchAggregatedResults]);

  return memoizedReturn;
};
