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
    sourceTypes: ['user']
  });

  const buildQuery = (baseQuery: any) => {
    let query = baseQuery;

    console.log('🔧 Building query with filters:', filters);

    // Usar filtros exactos para los valores seleccionados (con trim para consistencia)
    if (filters.autonomousCommunity?.trim()) {
      const trimmedValue = filters.autonomousCommunity.trim();
      console.log('🎯 Applying CA filter:', trimmedValue);
      query = query.eq('comunidad_autonoma', trimmedValue);
    }
    if (filters.province?.trim()) {
      const trimmedValue = filters.province.trim();
      console.log('🎯 Applying Province filter:', trimmedValue);
      query = query.eq('provincia', trimmedValue);
    }
    if (filters.municipality?.trim()) {
      const trimmedValue = filters.municipality.trim();
      console.log('🎯 Applying Municipality filter:', trimmedValue);
      query = query.eq('municipio', trimmedValue);
    }
    if (filters.district?.trim()) {
      const trimmedValue = filters.district.trim();
      console.log('🎯 Applying District filter:', trimmedValue);
      query = query.eq('district', trimmedValue);
    }
    if (filters.section?.trim()) {
      const trimmedValue = filters.section.trim();
      console.log('🎯 Applying Section filter:', trimmedValue);
      query = query.eq('section', trimmedValue);
    }
    if (filters.table?.trim()) {
      const trimmedValue = filters.table.trim();
      console.log('🎯 Applying Table filter:', trimmedValue);
      query = query.eq('table_letter', trimmedValue);
    }
    if (filters.sourceTypes.length > 0) {
      console.log('🎯 Applying Source Types filter:', filters.sourceTypes);
      query = query.in('source_type', filters.sourceTypes);
    }

    return query;
  };

  const fetchAggregatedResults = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching aggregated results with filters:', filters);

      // Get individual electoral acts first
      let individualQuery = supabase
        .from('electoral_acts_with_municipalities')
        .select('*')
        .order('created_at', { ascending: false });

      individualQuery = buildQuery(individualQuery);

      const { data: individualActas, error: individualError } = await individualQuery;

      if (individualError) {
        console.error('❌ Error fetching individual actas:', individualError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas electorales.",
        });
        setAggregatedResults(null);
        return;
      }

      console.log('✅ Individual actas loaded:', individualActas?.length || 0);

      // If no acts, return empty result
      if (!individualActas || individualActas.length === 0) {
        console.log('ℹ️ No actas found matching current filters');
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

      // Get party votes for these acts
      const actIds = individualActas.map(act => act.id);
      
      const { data: partyVotes, error: partyVotesError } = await supabase
        .from('party_votes')
        .select(`
          votes,
          electoral_act_id,
          political_parties (
            id,
            name,
            siglas,
            color
          )
        `)
        .in('electoral_act_id', actIds);

      if (partyVotesError) {
        console.error('❌ Error fetching party votes:', partyVotesError);
        // Continue without party votes
      }

      console.log('✅ Party votes loaded:', partyVotes?.length || 0);

      // Aggregate the data
      const aggregated = aggregateElectoralData(individualActas, partyVotes || []);
      setAggregatedResults(aggregated);

    } catch (error) {
      console.error('💥 Error fetching aggregated results:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar los resultados electorales.",
      });
      setAggregatedResults(null);
    } finally {
      setLoading(false);
    }
  };

  const aggregateElectoralData = (acts: any[], partyVotes: any[]): AggregatedResults => {
    // Basic calculations
    const totalCensus = acts.reduce((sum, act) => sum + (act.census_total || 0), 0);
    const totalVotes = acts.reduce((sum, act) => sum + (act.total_voters || 0), 0);
    const blankVotes = acts.reduce((sum, act) => sum + (act.blank_votes || 0), 0);
    const nullVotes = acts.reduce((sum, act) => sum + (act.null_votes || 0), 0);
    const validVotes = totalVotes - blankVotes - nullVotes;
    const participation = totalCensus > 0 ? (totalVotes / totalCensus) * 100 : 0;

    // Aggregate votes by party and source
    const partyVotesMap = new Map<string, { 
      party: any; 
      sourceResults: Map<string, number>; 
      totalVotes: number 
    }>();
    
    partyVotes.forEach(pv => {
      if (pv.political_parties) {
        const partyKey = pv.political_parties.siglas;
        const act = acts.find(a => a.id === pv.electoral_act_id);
        const sourceType = act?.source_type || 'unknown';
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

    // Calculate valid votes by source for percentages
    const validVotesBySource = new Map<string, number>();
    filters.sourceTypes.forEach(sourceType => {
      const sourceValidVotes = acts
        .filter(act => act.source_type === sourceType)
        .reduce((sum, act) => sum + (act.total_voters - act.blank_votes - act.null_votes), 0);
      validVotesBySource.set(sourceType, sourceValidVotes);
    });

    // Convert to final format
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

    console.log('📊 Aggregated results completed:', {
      totalVotes,
      totalCensus,
      partyResults: partyResults.length,
      individualActas: acts.length
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
      individualActas: acts
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
