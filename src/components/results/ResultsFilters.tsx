
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocationOptions } from '@/hooks/useLocationOptions';

interface ResultsFiltersProps {
  filters: {
    autonomousCommunity: string;
    province: string;
    municipality: string;
    district: string;
    section: string;
    table: string;
    sourceTypes: string[];
  };
  onFiltersChange: (filters: any) => void;
  isLoading?: boolean;
}

export const ResultsFilters = ({ filters, onFiltersChange, isLoading = false }: ResultsFiltersProps) => {
  // Estado local para los inputs de texto (mantenemos solo los que siguen siendo inputs)
  const [localFilters, setLocalFilters] = useState({
    municipality: filters.municipality,
    district: filters.district,
    section: filters.section,
    table: filters.table,
  });

  // Obtener opciones de ubicación
  const { autonomousCommunities, provinces, loading: optionsLoading } = useLocationOptions(filters.autonomousCommunity);

  // Debounce para los filtros de texto (600ms de retraso)
  const debouncedFilters = useDebounce(localFilters, 600);

  // Actualizar filtros globales cuando cambien los valores debounced
  useEffect(() => {
    onFiltersChange((prev: any) => ({
      ...prev,
      ...debouncedFilters
    }));
  }, [debouncedFilters, onFiltersChange]);

  // Sincronizar estado local cuando cambien los filtros externos
  useEffect(() => {
    setLocalFilters({
      municipality: filters.municipality,
      district: filters.district,
      section: filters.section,
      table: filters.table,
    });
  }, [filters.municipality, filters.district, filters.section, filters.table]);

  const handleLocalFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: string, value: string) => {
    // Convertir "all" a cadena vacía para mantener la compatibilidad
    const actualValue = value === "all" ? "" : value;
    
    // Los selects se aplican inmediatamente
    onFiltersChange((prev: any) => ({ 
      ...prev, 
      [key]: actualValue,
      // Si se cambia la comunidad autónoma, limpiar la provincia
      ...(key === 'autonomousCommunity' ? { province: '' } : {})
    }));
  };

  const handleSourceTypesChange = (value: string[]) => {
    // Los toggles se aplican inmediatamente sin debounce
    onFiltersChange((prev: any) => ({ ...prev, sourceTypes: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Filtros de Búsqueda
          {(isLoading || optionsLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="ca-filter">Comunidad Autónoma</Label>
            <Select 
              value={filters.autonomousCommunity || "all"} 
              onValueChange={(value) => handleSelectChange('autonomousCommunity', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar CA..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las CA</SelectItem>
                {autonomousCommunities.map((ca) => (
                  <SelectItem key={ca} value={ca}>
                    {ca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="province-filter">Provincia</Label>
            <Select 
              value={filters.province || "all"} 
              onValueChange={(value) => handleSelectChange('province', value)}
              disabled={!filters.autonomousCommunity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar provincia..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las provincias</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="municipality-filter">Municipio</Label>
            <Input
              id="municipality-filter"
              placeholder="Buscar municipio..."
              value={localFilters.municipality}
              onChange={(e) => handleLocalFilterChange('municipality', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="district-filter">Distrito</Label>
            <Input
              id="district-filter"
              placeholder="Ej: 01"
              value={localFilters.district}
              onChange={(e) => handleLocalFilterChange('district', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="section-filter">Sección</Label>
            <Input
              id="section-filter"
              placeholder="Ej: 001"
              value={localFilters.section}
              onChange={(e) => handleLocalFilterChange('section', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="table-filter">Mesa</Label>
            <Input
              id="table-filter"
              placeholder="Ej: A"
              value={localFilters.table}
              onChange={(e) => handleLocalFilterChange('table', e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label className="text-base font-medium">Fuentes de Datos</Label>
          <ToggleGroup 
            type="multiple" 
            value={filters.sourceTypes} 
            onValueChange={handleSourceTypesChange}
            className="justify-start mt-2 flex-wrap"
          >
            <ToggleGroupItem value="user" variant="outline">
              Actas de Usuario
            </ToggleGroupItem>
            <ToggleGroupItem value="indra" variant="outline">
              INDRA
            </ToggleGroupItem>
            <ToggleGroupItem value="escrutinio" variant="outline">
              Escrutinio General
            </ToggleGroupItem>
            <ToggleGroupItem value="oficial" variant="outline">
              Resultado Oficial
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
};
