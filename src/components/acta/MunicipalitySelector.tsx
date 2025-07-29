
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MpcaData } from '@/types/acta';
import { useAppData } from '@/hooks/useAppData';

interface MunicipalitySelectorProps {
  selectedMunicipalityId: string;
  onMunicipalitySelect: (municipalityId: string, municipalityData: MpcaData | null) => void;
}

export const MunicipalitySelector = ({ 
  selectedMunicipalityId, 
  onMunicipalitySelect 
}: MunicipalitySelectorProps) => {
  const { mpcaData, loading, error } = useAppData();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedMunicipality = useMemo(() => 
    mpcaData.find(m => m.idm.toString() === selectedMunicipalityId),
    [mpcaData, selectedMunicipalityId]
  );

  const filteredMunicipalities = useMemo(() => {
    if (!searchValue.trim()) return mpcaData;
    
    const search = searchValue.toLowerCase().trim();
    const filtered = mpcaData.filter((mpca) => {
      const municipioMatch = mpca.municipio?.toLowerCase().includes(search);
      const provinciaMatch = mpca.provincia?.toLowerCase().includes(search);
      const caMatch = mpca.ca?.toLowerCase().includes(search);
      return municipioMatch || provinciaMatch || caMatch;
    });

    // Sort results to prioritize exact matches
    return filtered.sort((a, b) => {
      const aExactMatch = a.municipio?.toLowerCase() === search;
      const bExactMatch = b.municipio?.toLowerCase() === search;
      const aStartsWithMatch = a.municipio?.toLowerCase().startsWith(search);
      const bStartsWithMatch = b.municipio?.toLowerCase().startsWith(search);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      if (aStartsWithMatch && !bStartsWithMatch) return -1;
      if (!aStartsWithMatch && bStartsWithMatch) return 1;
      
      return a.municipio?.localeCompare(b.municipio || '') || 0;
    });
  }, [mpcaData, searchValue]);

  const handleSelect = (municipality: MpcaData) => {
    onMunicipalitySelect(municipality.idm.toString(), municipality);
    setOpen(false);
    setSearchValue('');
  };

  if (loading) {
    return (
      <div>
        <Label htmlFor="municipio">Municipio *</Label>
        <Button variant="outline" className="w-full justify-between" disabled>
          Cargando municipios...
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
            Error al cargar municipios
          </div>
        </Button>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="municipio">Municipio *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedMunicipality
              ? selectedMunicipality.municipio
              : "Seleccionar municipio..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-[100] bg-popover" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar municipio, provincia o comunidad..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandEmpty>
                {mpcaData.length === 0 
                  ? "No hay municipios disponibles" 
                  : "No se encontraron resultados"}
              </CommandEmpty>
              <CommandGroup>
                {filteredMunicipalities.slice(0, 500).map((municipality) => (
                  <CommandItem
                    key={municipality.idm}
                    value={`${municipality.municipio} ${municipality.provincia} ${municipality.ca}`}
                    onSelect={() => handleSelect(municipality)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedMunicipalityId === municipality.idm.toString() 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{municipality.municipio}</span>
                      <span className="text-xs text-muted-foreground">
                        {municipality.provincia}, {municipality.ca}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {mpcaData.length > 0 && (
        <p className="text-xs text-green-600 mt-1">
          ✅ {mpcaData.length} municipios cargados correctamente
        </p>
      )}
    </div>
  );
};
