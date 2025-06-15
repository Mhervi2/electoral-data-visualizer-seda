
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResultsFiltersProps {
  filters: {
    municipality: string;
    district: string;
    section: string;
    table: string;
    sourceType: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const ResultsFilters = ({ filters, onFiltersChange }: ResultsFiltersProps) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Búsqueda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div>
            <Label htmlFor="source-filter">Fuente</Label>
            <Select value={filters.sourceType} onValueChange={(value) => handleFilterChange('sourceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las fuentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="user">Acta de Usuario</SelectItem>
                <SelectItem value="indra">INDRA</SelectItem>
                <SelectItem value="escrutinio">Escrutinio General</SelectItem>
                <SelectItem value="oficial">Resultado Oficial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
