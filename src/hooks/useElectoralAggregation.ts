import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateProvincialSeats, aggregateAutonomousSeats, ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';

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
  mesa_identifier: string;
  full_identifier?: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  observations?: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
  mpca?: {
    municipio: string;
    provincia: string;
    ca: string;
  };
}

interface SourceMetrics {
  source: string;
  totalCensus: number;
  totalVotes: number;
  participation: number;
  abstention: number;
  abstentionPercentage: number;
  blankVotes: number;
  nullVotes: number;
  validVotes: number;
}

interface AggregatedResults {
  totalVotes: number;
  totalCensus: number;
  participation: number;
  blankVotes: number;
  nullVotes: number;
  validVotes: number;
  abstention: number;
  abstentionPercentage: number;
  partyResults: PartyResultBySource[];
  sourceComparison: {
    source: string;
    totalVotes: number;
    coverage: number;
  }[];
  sourceMetrics: SourceMetrics[];
  selectedSources: string[];
  individualActas: ElectoralAct[];
  provincialSeats?: ProvincialResult[];
  autonomousSeats?: AutonomousResult[];
  nationalSeats?: { party: string; seats: number; color: string }[];
}

interface Filters {
  electionId: string;
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
    electionId: '',
    autonomousCommunity: '',
    province: '',
    municipality: '',
    district: '',
    section: '',
    table: '',
    sourceTypes: ['user']
  });

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const deduplicateActs = (acts: ElectoralAct[]): ElectoralAct[] => {
    console.log('🔍 Starting deduplication process with', acts.length, 'acts');
    
    // Group acts by full_identifier
    const duplicateGroups = new Map<string, ElectoralAct[]>();
    const nonDuplicates: ElectoralAct[] = [];

    acts.forEach(act => {
      const fullId = act.full_identifier || act.mesa_identifier;
      
      if (!fullId) {
        // Acts without identifier are not considered duplicates
        nonDuplicates.push(act);
        console.log('⚠️ Act without identifier found:', act.id);
        return;
      }

      if (duplicateGroups.has(fullId)) {
        duplicateGroups.get(fullId)!.push(act);
      } else {
        duplicateGroups.set(fullId, [act]);
      }
    });

    // For each group, keep only the most recent act
    const deduplicatedActs: ElectoralAct[] = [...nonDuplicates];
    let totalFiltered = 0;

    duplicateGroups.forEach((group, fullId) => {
      if (group.length > 1) {
        // Sort by created_at descending and take the first (most recent)
        const sortedGroup = group.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        deduplicatedActs.push(sortedGroup[0]);
        totalFiltered += group.length - 1;
        
        console.log(`🔄 Duplicate found for ${fullId}: keeping latest from ${sortedGroup[0].created_at}, filtering ${group.length - 1} older versions`);
      } else {
        // Single act, keep it
        deduplicatedActs.push(group[0]);
      }
    });

    console.log(`📋 Deduplication complete: ${totalFiltered} duplicate acts filtered, ${deduplicatedActs.length} unique acts remaining from ${duplicateGroups.size} groups + ${nonDuplicates.length} non-duplicates`);

    return deduplicatedActs;
  };

  const buildQuery = (baseQuery: any) => {
    let query = baseQuery;

    console.log('🔧 Building query with filters:', filters);

    // Filter by election first if specified
    if (filters.electionId?.trim()) {
      const trimmedValue = filters.electionId.trim();
      console.log('🎯 Applying Election filter:', trimmedValue);
      query = query.eq('election_id', trimmedValue);
    }

    // Usar filtros exactos para los valores seleccionados (con trim para consistencia)
    if (filters.autonomousCommunity?.trim()) {
      const trimmedValue = filters.autonomousCommunity.trim();
      console.log('🎯 Applying CA filter:', trimmedValue);
      query = query.eq('mpca.ca', trimmedValue);
    }
    if (filters.province?.trim()) {
      const trimmedValue = filters.province.trim();
      console.log('🎯 Applying Province filter:', trimmedValue);
      query = query.eq('mpca.provincia', trimmedValue);
    }
    if (filters.municipality?.trim()) {
      const trimmedValue = filters.municipality.trim();
      console.log('🎯 Applying Municipality filter:', trimmedValue);
      query = query.eq('mpca.municipio', trimmedValue);
    }
    if (filters.district?.trim() || filters.section?.trim() || filters.table?.trim()) {
      // Si tenemos filtros de mesa específicos, necesitamos filtrar por mesa_identifier
      const targetMesaPattern = `${filters.district?.trim() || '\\d{1,2}'}-${filters.section?.trim() || '\\d{3}'}-${filters.table?.trim() || '[A-Z]'}`;
      console.log('🎯 Applying Mesa filter pattern:', targetMesaPattern);
      
      // Para filtros exactos, construimos el identificador exacto
      if (filters.district?.trim() && filters.section?.trim() && filters.table?.trim()) {
        const exactMesa = `${filters.district.trim()}-${filters.section.trim()}-${filters.table.trim()}`;
        query = query.eq('mesa_identifier', exactMesa);
      } else {
        // Para filtros parciales, usamos LIKE con patrones
        let likePattern = '';
        if (filters.district?.trim()) {
          likePattern += `${filters.district.trim()}-`;
        } else {
          likePattern += '%';
        }
        if (filters.section?.trim()) {
          likePattern += `${filters.section.trim()}-`;
        } else {
          likePattern += '%';
        }
        if (filters.table?.trim()) {
          likePattern += filters.table.trim();
        } else {
          likePattern += '%';
        }
        query = query.like('mesa_identifier', likePattern);
      }
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
        .from('electoral_acts')
        .select(`
          *,
          mpca!inner(
            municipio,
            provincia,
            ca
          )
        `)
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
          abstention: 0,
          abstentionPercentage: 0,
          partyResults: [],
          sourceComparison: [],
          sourceMetrics: [],
          selectedSources: filters.sourceTypes,
          individualActas: []
        });
        return;
      }

      // Deduplicate acts before aggregation
      console.log('🔍 Before deduplication:', individualActas.length, 'acts');
      console.log('📋 Sample acts for debugging:', individualActas.slice(0, 3).map(act => ({
        id: act.id,
        full_identifier: act.full_identifier,
        mesa_identifier: act.mesa_identifier,
        created_at: act.created_at,
        municipio: act.mpca?.municipio
      })));
      
      const deduplicatedActas = deduplicateActs(individualActas);
      console.log('✅ After deduplication:', deduplicatedActas.length, 'acts');

      // Get party votes for these deduplicated acts
      const actIds = deduplicatedActas.map(act => act.id);
      
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

      // Get provincial seats data
      const { data: provincialSeats } = await supabase
        .from('provincial_seats')
        .select('provincia, seats')
        .or(`election_id.eq.${filters.electionId || 'null'},election_id.is.null`);

      // Get MPCA data for autonomous community aggregation
      const { data: mpcaData } = await supabase
        .from('mpca')
        .select('provincia, ca');

      // Aggregate the data
      const aggregated = await aggregateElectoralData(deduplicatedActas, partyVotes || [], provincialSeats || [], mpcaData || []);
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

  const aggregateElectoralData = async (acts: any[], partyVotes: any[], provincialSeats: any[] = [], mpcaData: any[] = []): Promise<AggregatedResults> => {
    // Basic calculations
    const totalCensus = acts.reduce((sum, act) => sum + (act.census_total || 0), 0);
    const totalVotes = acts.reduce((sum, act) => sum + (act.total_voters || 0), 0);
    const blankVotes = acts.reduce((sum, act) => sum + (act.blank_votes || 0), 0);
    const nullVotes = acts.reduce((sum, act) => sum + (act.null_votes || 0), 0);
    
    // Calculate abstention (people who didn't vote)
    const abstention = totalCensus - totalVotes;
    const abstentionPercentage = totalCensus > 0 ? (abstention / totalCensus) * 100 : 0;
    // Valid votes for party calculations (exclude null and blank votes)
    const validVotes = totalVotes - nullVotes - blankVotes;
    const participation = totalCensus > 0 ? (totalVotes / totalCensus) * 100 : 0;

    // Calculate metrics by source
    const sourceMetrics: SourceMetrics[] = filters.sourceTypes.map(sourceType => {
      const sourceActs = acts.filter(act => act.source_type === sourceType);
      const sourceTotalCensus = sourceActs.reduce((sum, act) => sum + (act.census_total || 0), 0);
      const sourceTotalVotes = sourceActs.reduce((sum, act) => sum + (act.total_voters || 0), 0);
      const sourceBlankVotes = sourceActs.reduce((sum, act) => sum + (act.blank_votes || 0), 0);
      const sourceNullVotes = sourceActs.reduce((sum, act) => sum + (act.null_votes || 0), 0);
      const sourceValidVotes = sourceTotalVotes - sourceNullVotes - sourceBlankVotes;
      const sourceParticipation = sourceTotalCensus > 0 ? (sourceTotalVotes / sourceTotalCensus) * 100 : 0;
      const sourceAbstention = sourceTotalCensus - sourceTotalVotes;
      const sourceAbstentionPercentage = sourceTotalCensus > 0 ? (sourceAbstention / sourceTotalCensus) * 100 : 0;

      return {
        source: sourceType,
        totalCensus: sourceTotalCensus,
        totalVotes: sourceTotalVotes,
        participation: sourceParticipation,
        abstention: sourceAbstention,
        abstentionPercentage: sourceAbstentionPercentage,
        blankVotes: sourceBlankVotes,
        nullVotes: sourceNullVotes,
        validVotes: sourceValidVotes
      };
    });

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

    // Calculate valid votes by source for percentages (exclude null and blank votes)
    const validVotesBySource = new Map<string, number>();
    filters.sourceTypes.forEach(sourceType => {
      const sourceValidVotes = acts
        .filter(act => act.source_type === sourceType)
        .reduce((sum, act) => sum + (act.total_voters - act.null_votes - act.blank_votes), 0);
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

    // Calculate D'Hondt results if we have provincial data and appropriate filtering
    let dhondtProvincialResults: ProvincialResult[] | undefined;
    let dhondtAutonomousResults: AutonomousResult[] | undefined;

    const shouldCalculateSeats = provincialSeats.length > 0 && partyVotes.length > 0;
    const isProvincialLevel = filters.province && !filters.municipality && !filters.district;
    const isAutonomousLevel = filters.autonomousCommunity && !filters.province;
    const isNationalLevel = !filters.autonomousCommunity && !filters.province && !filters.municipality && !filters.district;

    if (shouldCalculateSeats && (isProvincialLevel || isAutonomousLevel || isNationalLevel)) {
      // Prepare data for D'Hondt calculation
      const partyVotesForDHondt = partyVotes
        .map(pv => {
          const act = acts.find(a => a.id === pv.electoral_act_id);
          return {
            party_id: pv.political_parties?.id,
            votes: pv.votes || 0,
            provincia: act?.provincia
          };
        })
        .filter(pv => pv.party_id && pv.provincia);

      const politicalParties = Array.from(new Set(partyVotes.map(pv => pv.political_parties).filter(Boolean)));

      if (isProvincialLevel && filters.province) {
        // Calculate for specific province
        const provinceSeats = provincialSeats.filter(ps => ps.provincia === filters.province);
        const provinceVotes = partyVotesForDHondt.filter(pv => pv.provincia === filters.province);
        
        // Get minimum threshold from election
        const { data: electionData } = await supabase
          .from('elections')
          .select('minimum_threshold')
          .eq('id', filters.electionId)
          .single();

        const minimumThreshold = electionData?.minimum_threshold || 3.0;

        if (provinceSeats.length > 0 && provinceVotes.length > 0) {
          dhondtProvincialResults = calculateProvincialSeats(provinceVotes, politicalParties, provinceSeats, minimumThreshold);
        }
      } else if (isAutonomousLevel && filters.autonomousCommunity) {
        // Calculate for all provinces in the autonomous community
        const communityProvinces = mpcaData
          .filter(m => m.ca === filters.autonomousCommunity)
          .map(m => m.provincia);
        
        const communitySeats = provincialSeats.filter(ps => communityProvinces.includes(ps.provincia));
        const communityVotes = partyVotesForDHondt.filter(pv => communityProvinces.includes(pv.provincia));
        
        // Get minimum threshold from election
        const { data: electionData } = await supabase
          .from('elections')
          .select('minimum_threshold')
          .eq('id', filters.electionId)
          .single();

        const minimumThreshold = electionData?.minimum_threshold || 3.0;

        if (communitySeats.length > 0 && communityVotes.length > 0) {
          dhondtProvincialResults = calculateProvincialSeats(communityVotes, politicalParties, communitySeats, minimumThreshold);
          dhondtAutonomousResults = aggregateAutonomousSeats(dhondtProvincialResults, mpcaData);
        }
      } else if (isNationalLevel) {
        // Calculate for all provinces (national level)
        // Get minimum threshold from election
        const { data: electionData } = await supabase
          .from('elections')
          .select('minimum_threshold')
          .eq('id', filters.electionId)
          .single();

        const minimumThreshold = electionData?.minimum_threshold || 3.0;

        if (provincialSeats.length > 0 && partyVotesForDHondt.length > 0) {
          dhondtProvincialResults = calculateProvincialSeats(partyVotesForDHondt, politicalParties, provincialSeats, minimumThreshold);
          dhondtAutonomousResults = aggregateAutonomousSeats(dhondtProvincialResults, mpcaData);
        }
      }
    }

    // Calculate national seats aggregation (sum of all provincial seats by party)
    let nationalSeats: { party: string; seats: number; color: string }[] | undefined;
    
    if (dhondtProvincialResults && dhondtProvincialResults.length > 0) {
      const nationalSeatsMap = new Map<string, { seats: number; color: string }>();
      
      dhondtProvincialResults.forEach(provinceResult => {
        provinceResult.parties.forEach(party => {
          const existing = nationalSeatsMap.get(party.name);
          // Find the party color from the political parties data
          const politicalParty = partyVotes.find(pv => pv.political_parties?.name === party.name || pv.political_parties?.siglas === party.name)?.political_parties;
          const partyColor = politicalParty?.color || '#6B7280';
          
          if (existing) {
            existing.seats += party.seats;
          } else {
            nationalSeatsMap.set(party.name, {
              seats: party.seats,
              color: partyColor
            });
          }
        });
      });
      
      nationalSeats = Array.from(nationalSeatsMap.entries())
        .map(([party, data]) => ({ party, seats: data.seats, color: data.color }))
        .filter(item => item.seats > 0)
        .sort((a, b) => b.seats - a.seats);
    }

    console.log('📊 Aggregated results completed:', {
      totalVotes,
      totalCensus,
      validVotes: `${validVotes} (incluye votos en blanco)`,
      partyResults: partyResults.length,
      sourceMetrics: sourceMetrics.length,
      individualActas: acts.length
    });

    return {
      totalVotes,
      totalCensus,
      participation,
      blankVotes,
      nullVotes,
      validVotes,
      abstention,
      abstentionPercentage,
      partyResults,
      sourceComparison,
      sourceMetrics,
      selectedSources: filters.sourceTypes,
      individualActas: acts.map(act => ({
        ...act,
        municipio: act.mpca?.municipio || act.municipio,
        provincia: act.mpca?.provincia || act.provincia,
        comunidad_autonoma: act.mpca?.ca || act.comunidad_autonoma
      })),
      provincialSeats: dhondtProvincialResults,
      autonomousSeats: dhondtAutonomousResults,
      nationalSeats
    };
  };

  useEffect(() => {
    fetchAggregatedResults();
  }, [filters.electionId, filters.autonomousCommunity, filters.province, filters.municipality, filters.district, filters.section, filters.table, filters.sourceTypes]);

  return {
    aggregatedResults,
    loading,
    filters,
    setFilters,
    refetch: fetchAggregatedResults
  };
};
