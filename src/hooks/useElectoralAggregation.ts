
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

  const fetchAggregatedResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching aggregated results with filters:', filters);

      // Build the query based on applied filters
      let query = supabase
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

      // Apply hierarchical filters
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

      const { data: acts, error } = await query;

      if (error) {
        console.error('Error fetching electoral acts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los resultados electorales.",
        });
        return;
      }

      // Aggregate the results
      const aggregated = aggregateElectoralData(acts || []);
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

  const aggregateElectoralData = (acts: any[]): AggregatedResults => {
    const totalCensus = acts.reduce((sum, act) => sum + (act.census_total || 0), 0);
    const totalVotes = acts.reduce((sum, act) => sum + (act.total_voters || 0), 0);
    const blankVotes = acts.reduce((sum, act) => sum + (act.blank_votes || 0), 0);
    const nullVotes = acts.reduce((sum, act) => sum + (act.null_votes || 0), 0);
    const validVotes = totalVotes - blankVotes - nullVotes;
    const participation = totalCensus > 0 ? (totalVotes / totalCensus) * 100 : 0;

    // Aggregate party votes by source
    const partyVotesMap = new Map<string, { party: any; sourceResults: Map<string, number>; totalVotes: number }>();
    
    acts.forEach(act => {
      if (act.party_votes) {
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

    return {
      totalVotes,
      totalCensus,
      participation,
      blankVotes,
      nullVotes,
      validVotes,
      partyResults,
      sourceComparison,
      selectedSources: filters.sourceTypes
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
