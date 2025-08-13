import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAvailableFilters } from '@/hooks/useAvailableFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComparisonFilters } from '@/hooks/useElectoralComparison';

interface ComparisonFiltersComponentProps {
  filters: ComparisonFilters;
  onFiltersChange: (filters: Partial<ComparisonFilters>) => void;
}

export const ComparisonFiltersComponent = ({ 
  filters, 
  onFiltersChange 
}: ComparisonFiltersComponentProps) => {
  const { 
    options: {
      autonomousCommunities,
      provinces,
      municipalities
    },
    loading 
  } = useAvailableFilters({
    autonomousCommunity: filters.autonomousCommunity || '',
    province: filters.province || '',
    municipality: filters.municipality || '',
    district: '',
    section: '',
    table: '',
    sourceTypes: filters.sourceTypes
  });

  const handleSelectChange = (field: keyof ComparisonFilters, value: string | undefined) => {
    const updates: Partial<ComparisonFilters> = { [field]: value };
    
    // Clear dependent filters when a higher level changes
    if (field === 'autonomousCommunity') {
      updates.province = undefined;
      updates.municipality = undefined;
    } else if (field === 'province') {
      updates.municipality = undefined;
    }
    
    onFiltersChange(updates);
  };

  const handleSourceTypesChange = (value: string[]) => {
    onFiltersChange({ sourceTypes: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comunidad Autónoma</label>
            <Select
              value={filters.autonomousCommunity || ""}
              onValueChange={(value) => 
                handleSelectChange('autonomousCommunity', value || undefined)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las comunidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las comunidades</SelectItem>
                {autonomousCommunities.map((ca) => (
                  <SelectItem key={ca} value={ca}>
                    {ca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Provincia</label>
            <Select
              value={filters.province || ""}
              onValueChange={(value) => 
                handleSelectChange('province', value || undefined)
              }
              disabled={loading || !filters.autonomousCommunity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las provincias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las provincias</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Municipio</label>
            <Select
              value={filters.municipality || ""}
              onValueChange={(value) => 
                handleSelectChange('municipality', value || undefined)
              }
              disabled={loading || !filters.province}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los municipios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los municipios</SelectItem>
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality} value={municipality}>
                    {municipality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Source Types */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fuentes de Datos</label>
          <ToggleGroup
            type="multiple"
            value={filters.sourceTypes}
            onValueChange={handleSourceTypesChange}
            className="justify-start flex-wrap"
          >
            <ToggleGroupItem value="user" aria-label="Actas de Usuario">
              Usuario
            </ToggleGroupItem>
            <ToggleGroupItem value="indra" aria-label="INDRA">
              INDRA
            </ToggleGroupItem>
            <ToggleGroupItem value="escrutinio" aria-label="Escrutinio General">
              Escrutinio
            </ToggleGroupItem>
            <ToggleGroupItem value="oficial" aria-label="Resultado Oficial">
              Oficial
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
};