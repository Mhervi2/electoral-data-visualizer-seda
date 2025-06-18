
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2 } from 'lucide-react';
import { useAvailableFilters } from '@/hooks/useAvailableFilters';

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
  // Usar el nuevo hook para obtener opciones basadas en datos reales
  const { options, loading: optionsLoading } = useAvailableFilters(filters);

  const handleSelectChange = (key: string, value: string) => {
    // Convertir "all" a cadena vacía para mantener la compatibilidad
    const actualValue = value === "all" ? "" : value;
    
    // Los selects se aplican inmediatamente
    const newFilters = { 
      ...filters, 
      [key]: actualValue
    };

    // Limpiar filtros dependientes cuando se cambie un filtro padre
    if (key === 'autonomousCommunity') {
      newFilters.province = '';
      newFilters.municipality = '';
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'province') {
      newFilters.municipality = '';
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'municipality') {
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'district') {
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'section') {
      newFilters.table = '';
    }

    onFiltersChange(newFilters);
  };

  const handleSourceTypesChange = (value: string[]) => {
    // Los toggles se aplican inmediatamente sin debounce
    onFiltersChange({ ...filters, sourceTypes: value });
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
                {options.autonomousCommunities.map((ca) => (
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
                {options.provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="municipality-filter">Municipio</Label>
            <Select 
              value={filters.municipality || "all"} 
              onValueChange={(value) => handleSelectChange('municipality', value)}
              disabled={!filters.province}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar municipio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los municipios</SelectItem>
                {options.municipalities.map((municipality) => (
                  <SelectItem key={municipality} value={municipality}>
                    {municipality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="district-filter">Distrito</Label>
            <Select 
              value={filters.district || "all"} 
              onValueChange={(value) => handleSelectChange('district', value)}
              disabled={!filters.municipality}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar distrito..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distritos</SelectItem>
                {options.districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="section-filter">Sección</Label>
            <Select 
              value={filters.section || "all"} 
              onValueChange={(value) => handleSelectChange('section', value)}
              disabled={!filters.district}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sección..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las secciones</SelectItem>
                {options.sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="table-filter">Mesa</Label>
            <Select 
              value={filters.table || "all"} 
              onValueChange={(value) => handleSelectChange('table', value)}
              disabled={!filters.section}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mesa..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las mesas</SelectItem>
                {options.tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
