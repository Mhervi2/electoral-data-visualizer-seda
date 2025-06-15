
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useElectoralAggregation } from '@/hooks/useElectoralAggregation';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { ElectoralSummary } from '@/components/results/ElectoralSummary';
import { ElectoralCharts } from '@/components/results/ElectoralCharts';
import { ResultsDetailsTable } from '@/components/results/ResultsDetailsTable';
import { SourceComparison } from '@/components/results/SourceComparison';
import DiscrepancyDetector from '@/components/results/DiscrepancyDetector';

const Results = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const {
    aggregatedResults,
    loading,
    filters,
    setFilters,
    refetch
  } = useElectoralAggregation();

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = {
      autonomousCommunity: searchParams.get('autonomousCommunity') || '',
      province: searchParams.get('province') || '',
      municipality: searchParams.get('municipality') || '',
      district: searchParams.get('district') || '',
      section: searchParams.get('section') || '',
      table: searchParams.get('table') || '',
      sourceTypes: ['user', 'indra', 'escrutinio', 'oficial']
    };
    
    setFilters(urlFilters);
  }, [searchParams, setFilters]);

  // Show toast if we came from submit form with existing act
  useEffect(() => {
    if (searchParams.get('municipality') && searchParams.get('district') && 
        searchParams.get('section') && searchParams.get('table')) {
      toast({
        title: "Acta existente",
        description: "Mostrando resultados para la mesa que intentaste enviar.",
      });
    }
  }, [searchParams, toast]);

  if (loading && !aggregatedResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Resultados Electorales
          </h1>
          <p className="text-muted-foreground">
            Visualiza los resultados agregados por nivel geográfico
          </p>
        </div>
      </div>

      <ResultsFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        isLoading={loading} 
      />

      {/* Discrepancy Detection Section (Admin Only) */}
      {user?.isAdmin && (
        <DiscrepancyDetector />
      )}

      {aggregatedResults && (
        <>
          {/* Summary Cards */}
          <ElectoralSummary
            totalVotes={aggregatedResults.totalVotes}
            totalCensus={aggregatedResults.totalCensus}
            participation={aggregatedResults.participation}
            blankVotes={aggregatedResults.blankVotes}
            nullVotes={aggregatedResults.nullVotes}
            validVotes={aggregatedResults.validVotes}
          />

          {/* Charts */}
          {aggregatedResults.partyResults.length > 0 && (
            <ElectoralCharts
              partyResults={aggregatedResults.partyResults}
              totalVotes={aggregatedResults.validVotes}
            />
          )}

          {/* Results Table */}
          {aggregatedResults.partyResults.length > 0 && (
            <ResultsDetailsTable
              partyResults={aggregatedResults.partyResults}
              totalVotes={aggregatedResults.validVotes}
              selectedSources={aggregatedResults.selectedSources}
            />
          )}

          {/* Source Comparison */}
          {aggregatedResults.sourceComparison.length > 0 && (
            <SourceComparison sourceComparison={aggregatedResults.sourceComparison} />
          )}
        </>
      )}

      {!aggregatedResults && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron resultados electorales que coincidan con los filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;
