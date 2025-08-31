import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Vote, ChevronDown, ChevronUp } from 'lucide-react';
import { useAvailableFilters } from '@/hooks/useAvailableFilters';
import { useElections } from '@/hooks/useElections';
import { getSourceTooltip } from '@/utils/sourceTooltips';
import { MunicipalityFilterCombobox } from './MunicipalityFilterCombobox';

interface ResultsFiltersProps {
  filters: {
    electionId: string;
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
  isScrolled?: boolean;
}

export const ResultsFilters = ({ filters, onFiltersChange, isLoading = false, isScrolled = false }: ResultsFiltersProps) => {
  const { options, loading: optionsLoading } = useAvailableFilters(filters);
  const { elections, loading: electionsLoading } = useElections();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectChange = (key: string, value: string) => {
    const actualValue = value === "all" ? "" : value;
    
    console.log(`🔄 Filter changed - ${key}:`, actualValue);
    
    const newFilters = { 
      ...filters, 
      [key]: actualValue
    };

    if (key === 'electionId') {
      console.log('🧹 Clearing all filters for Election change');
      newFilters.autonomousCommunity = '';
      newFilters.province = '';
      newFilters.municipality = '';
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'autonomousCommunity') {
      console.log('🧹 Clearing dependent filters for CA change');
      newFilters.province = '';
      newFilters.municipality = '';
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'province') {
      console.log('🧹 Clearing dependent filters for Province change');
      newFilters.municipality = '';
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'municipality') {
      console.log('🧹 Clearing dependent filters for Municipality change');
      newFilters.district = '';
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'district') {
      console.log('🧹 Clearing dependent filters for District change');
      newFilters.section = '';
      newFilters.table = '';
    } else if (key === 'section') {
      console.log('🧹 Clearing dependent filters for Section change');
      newFilters.table = '';
    }

    console.log('📤 Sending new filters:', newFilters);
    onFiltersChange(newFilters);
  };

  const handleSourceTypesChange = (value: string[]) => {
    console.log('🔄 Source types changed:', value);
    onFiltersChange({ ...filters, sourceTypes: value });
  };

  const getSelectedElectionName = () => {
    if (!filters.electionId) return null;
    const selectedElection = elections.find(e => e.id === filters.electionId);
    return selectedElection?.name || null;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.electionId) count++;
    if (filters.autonomousCommunity) count++;
    if (filters.province) count++;
    if (filters.municipality) count++;
    if (filters.district) count++;
    if (filters.section) count++;
    if (filters.table) count++;
    if (filters.sourceTypes.length > 0) count++;
    return count;
  };

  const getFilterSummaryText = () => {
    const parts = [];
    if (filters.electionId) {
      const election = elections.find(e => e.id === filters.electionId);
      if (election) parts.push(election.name);
    }
    if (filters.autonomousCommunity) parts.push(filters.autonomousCommunity);
    if (filters.province) parts.push(filters.province);
    if (filters.municipality) parts.push(filters.municipality);
    if (filters.district) parts.push(`Dist. ${filters.district}`);
    if (filters.section) parts.push(`Secc. ${filters.section}`);
    if (filters.table) parts.push(`Mesa ${filters.table}`);
    if (filters.sourceTypes.length > 0) parts.push(`${filters.sourceTypes.length} fuente(s)`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Sin filtros aplicados';
  };


  // Versión compacta para cuando hay scroll
  if (isScrolled && !isExpanded) {
    return (
      <TooltipProvider>
        <Card className="border-b rounded-none shadow-md">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vote className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Filtros aplicados</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[500px]">
                    {getFilterSummaryText()}
                  </div>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {filters.sourceTypes.length > 0 && (
                  <div className="hidden md:flex items-center gap-1">
                    <ToggleGroup 
                      type="multiple" 
                      value={filters.sourceTypes} 
                      onValueChange={handleSourceTypesChange}
                      className="h-8"
                      size="sm"
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
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="h-8 px-3"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Versión completa (normal o expandida cuando hay scroll)
  return (
    <TooltipProvider>
      <Card className={isScrolled ? "border-b rounded-none shadow-md" : ""}>
        <CardHeader className={isScrolled ? "pb-3" : ""}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Filtros de Búsqueda
              {(isLoading || optionsLoading || electionsLoading) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            {isScrolled && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 px-3"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
          {getSelectedElectionName() && (
            <p className="text-sm text-muted-foreground">
              Mostrando resultados para: <span className="font-medium text-primary">{getSelectedElectionName()}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-b pb-4">
            <Label htmlFor="election-filter" className="text-base font-semibold">Proceso Electoral</Label>
            <p className="text-xs text-muted-foreground mb-2">Selecciona qué elección quieres analizar</p>
            <Select 
              value={filters.electionId || "all"} 
              onValueChange={(value) => handleSelectChange('electionId', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar proceso electoral..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las elecciones</SelectItem>
                {elections.map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    <div className="flex items-center gap-2">
                      <span>{election.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        election.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {election.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Filtros Geográficos</Label>
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
                <MunicipalityFilterCombobox
                  municipalities={options.municipalities}
                  selectedValue={filters.municipality || "all"}
                  onSelect={(value) => handleSelectChange('municipality', value)}
                  placeholder="Seleccionar municipio..."
                  disabled={!filters.province}
                />
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
          </div>
          
          <div>
            <Label className="text-base font-medium">Fuentes de Datos</Label>
            <ToggleGroup 
              type="multiple" 
              value={filters.sourceTypes} 
              onValueChange={handleSourceTypesChange}
              className="justify-start mt-2 flex-wrap"
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
    </TooltipProvider>
  );
};
