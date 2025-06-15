
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useResultsData } from '@/hooks/useResultsData';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { ResultsTable } from '@/components/results/ResultsTable';
import DiscrepancyDetector from '@/components/results/DiscrepancyDetector';

const Results = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const {
    electoralActs,
    discrepancies,
    loading,
    filters,
    setFilters,
    fetchElectoralActs,
    fetchDiscrepancies
  } = useResultsData();

  useEffect(() => {
    fetchElectoralActs();
    if (user?.isAdmin) {
      fetchDiscrepancies();
    }
  }, [user?.isAdmin]);

  // Separate useEffect for filters to avoid infinite loops
  useEffect(() => {
    if (!loading) {
      fetchElectoralActs();
    }
  }, [filters.municipality, filters.district, filters.section, filters.table, filters.sourceType]);

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

  if (loading) {
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
            Visualiza los resultados detallados por mesa electoral
          </p>
        </div>
      </div>

      <ResultsFilters filters={filters} onFiltersChange={setFilters} />

      {/* Discrepancy Detection Section (Admin Only) */}
      {user?.isAdmin && (
        <DiscrepancyDetector />
      )}

      <ResultsTable electoralActs={electoralActs} />
    </div>
  );
};

export default Results;
