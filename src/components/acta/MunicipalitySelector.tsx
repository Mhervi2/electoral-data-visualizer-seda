
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, AlertCircle } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { useAppData } from '@/hooks/useAppData';
import { ServerMunicipalityCombobox } from './ServerMunicipalityCombobox';

interface MunicipalitySelectorProps {
  selectedMunicipalityId: string;
  onMunicipalitySelect: (municipalityId: string, municipalityData: MpcaData | null) => void;
}

export const MunicipalitySelector = ({ 
  selectedMunicipalityId, 
  onMunicipalitySelect 
}: MunicipalitySelectorProps) => {
  const { loading, error } = useAppData();

  const handleSelect = (municipalityId: string) => {
    // Since we're using server search, we don't have the municipality data here
    // We'll pass null and let the parent component handle it if needed
    onMunicipalitySelect(municipalityId, null);
  };

  if (loading) {
    return (
      <div>
        <Label htmlFor="municipio">Municipio *</Label>
        <Button variant="outline" className="w-full justify-between" disabled>
          Cargando datos...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Label htmlFor="municipio">Municipio *</Label>
        <Button variant="outline" className="w-full justify-between border-red-300" disabled>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Error al cargar datos
          </div>
        </Button>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="municipio">Municipio *</Label>
      <ServerMunicipalityCombobox
        selectedValue={selectedMunicipalityId}
        onSelect={handleSelect}
        placeholder="Buscar municipio..."
      />
      <p className="text-xs text-green-600 mt-1">
        ✅ Búsqueda del servidor activada - escribe para buscar municipios
      </p>
    </div>
  );
};
