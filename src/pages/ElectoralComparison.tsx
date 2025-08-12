import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useElections } from '@/hooks/useElections';
import { useElectoralComparison, ComparisonFilters } from '@/hooks/useElectoralComparison';
import { ComparisonCharts } from '@/components/comparison/ComparisonCharts';
import { ComparisonFiltersComponent } from '@/components/comparison/ComparisonFilters';

const ElectoralComparison = () => {
  const { elections, loading: electionsLoading } = useElections();
  const { 
    loading, 
    comparisonData, 
    selectedElections, 
    setSelectedElections,
    fetchComparisonData 
  } = useElectoralComparison();

  const [filters, setFilters] = useState<ComparisonFilters>({
    electionIds: [],
    sourceTypes: ['user', 'indra', 'escrutinio', 'oficial']
  });

  const electionOptions = elections.map(election => ({
    value: election.id,
    label: election.name
  }));

  const handleElectionChange = (selectedValues: string[]) => {
    if (selectedValues.length <= 4) {
      const newSelectedElections = selectedValues.map(id => {
        const election = elections.find(e => e.id === id);
        return election ? { id: election.id, name: election.name } : null;
      }).filter(Boolean) as any[];

      setSelectedElections(newSelectedElections);
      setFilters(prev => ({
        ...prev,
        electionIds: selectedValues
      }));
    }
  };

  const handleFiltersChange = (newFilters: Partial<ComparisonFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleApplyFilters = () => {
    fetchComparisonData(filters);
  };

  useEffect(() => {
    if (filters.electionIds.length > 0) {
      fetchComparisonData(filters);
    }
  }, []);

  if (electionsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk">Comparación Electoral</h1>
        <p className="text-muted-foreground">
          Compara resultados electorales entre diferentes elecciones para analizar la evolución de los partidos políticos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Elecciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Elecciones a comparar (máximo 4)
            </label>
            <MultiSelect
              options={electionOptions}
              value={filters.electionIds}
              onChange={handleElectionChange}
              placeholder="Selecciona hasta 4 elecciones..."
              maxSelected={4}
            />
          </div>

          {filters.electionIds.length > 0 && (
            <>
              <ComparisonFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              
              <Button onClick={handleApplyFilters} disabled={loading}>
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {comparisonData.length > 0 && (
        <ComparisonCharts 
          data={comparisonData}
          elections={selectedElections}
        />
      )}

      {filters.electionIds.length > 0 && comparisonData.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron datos para las elecciones y filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ElectoralComparison;