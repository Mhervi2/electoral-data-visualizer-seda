import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useElectoralAggregation } from '@/hooks/useElectoralAggregation';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { ElectoralSummaryTable } from '@/components/results/ElectoralSummaryTable';
import { ElectoralCharts } from '@/components/results/ElectoralCharts';
import { ResultsDetailsTable } from '@/components/results/ResultsDetailsTable';
import { IndividualActsList } from '@/components/results/IndividualActsList';
import DiscrepancyDetector from '@/components/results/DiscrepancyDetector';
import { DHondtResults } from '@/components/results/DHondtResults';

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
      electionId: searchParams.get('electionId') || '',
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

  const handleActaClick = (acta: any) => {
    console.log('Acta clicked:', acta);
    
    // Auto-fill filters with acta data
    setFilters(prev => ({
      ...prev,
      autonomousCommunity: acta.comunidad_autonoma || '',
      province: acta.provincia || '',
      municipality: acta.municipio || '',
      district: acta.district || '',
      section: acta.section || '',
      table: acta.table_letter || ''
    }));

    toast({
      title: "Filtros actualizados",
      description: `Mostrando datos específicos del acta: Mesa ${acta.table_letter}, ${acta.municipio}`,
    });
  };

  const handleDiscrepancyClick = (discrepancy: any) => {
    console.log('Discrepancy clicked:', discrepancy);
    
    // Parse mesa identifier
    const parts = discrepancy.mesa_identifier?.split('-') || [];
    const district = parts[0] || '';
    const section = parts[1] || '';
    const table = parts[2] || '';
    
    // Auto-fill filters with discrepancy data
    setFilters(prev => ({
      ...prev,
      municipality: discrepancy.municipality || '',
      district: district,
      section: section,
      table: table
    }));

    toast({
      title: "Filtros actualizados",
      description: `Mostrando datos de la discrepancia: Mesa ${discrepancy.mesa_identifier}, ${discrepancy.municipality}`,
    });
  };

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
        <DiscrepancyDetector onDiscrepancyClick={handleDiscrepancyClick} />
      )}

      {aggregatedResults && (
        <>
          {/* Summary Table by Source */}
          <ElectoralSummaryTable
            sourceMetrics={aggregatedResults.sourceMetrics}
          />

          {/* Charts */}
          {aggregatedResults.partyResults.length > 0 && (
            <ElectoralCharts
              partyResults={aggregatedResults.partyResults}
              totalVotes={aggregatedResults.validVotes}
              totalCensus={aggregatedResults.totalCensus}
              abstention={aggregatedResults.abstention}
              selectedSources={aggregatedResults.selectedSources}
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

          {/* D'Hondt Seat Distribution */}
          {(aggregatedResults.provincialSeats || aggregatedResults.autonomousSeats || aggregatedResults.nationalSeats) && (
            <DHondtResults
              provincialResults={aggregatedResults.provincialSeats}
              autonomousResults={aggregatedResults.autonomousSeats}
              nationalSeats={aggregatedResults.nationalSeats}
              title="Distribución de Escaños (Método D'Hondt)"
              filters={{
                autonomousCommunity: filters.autonomousCommunity,
                province: filters.province,
                municipality: filters.municipality
              }}
            />
          )}

          {/* Individual Actas List - replaces SourceComparison */}
          {aggregatedResults.individualActas.length > 0 && (
            <IndividualActsList 
              individualActas={aggregatedResults.individualActas}
              onActaClick={handleActaClick}
            />
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
