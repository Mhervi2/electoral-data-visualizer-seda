
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
}

export const ResultsFilters = ({ filters, onFiltersChange }: ResultsFiltersProps) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSourceTypesChange = (value: string[]) => {
    onFiltersChange((prev: any) => ({ ...prev, sourceTypes: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Búsqueda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="ca-filter">Comunidad Autónoma</Label>
            <Input
              id="ca-filter"
              placeholder="Buscar CA..."
              value={filters.autonomousCommunity}
              onChange={(e) => handleFilterChange('autonomousCommunity', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="province-filter">Provincia</Label>
            <Input
              id="province-filter"
              placeholder="Buscar provincia..."
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="municipality-filter">Municipio</Label>
            <Input
              id="municipality-filter"
              placeholder="Buscar municipio..."
              value={filters.municipality}
              onChange={(e) => handleFilterChange('municipality', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="district-filter">Distrito</Label>
            <Input
              id="district-filter"
              placeholder="Ej: 01"
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="section-filter">Sección</Label>
            <Input
              id="section-filter"
              placeholder="Ej: 001"
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="table-filter">Mesa</Label>
            <Input
              id="table-filter"
              placeholder="Ej: A"
              value={filters.table}
              onChange={(e) => handleFilterChange('table', e.target.value)}
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
