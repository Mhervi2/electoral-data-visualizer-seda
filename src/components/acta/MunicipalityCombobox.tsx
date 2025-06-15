
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MpcaData } from '@/types/acta';

interface MunicipalityComboboxProps {
  mpcaData: MpcaData[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export const MunicipalityCombobox = ({ 
  mpcaData, 
  selectedValue, 
  onSelect, 
  placeholder = "Buscar municipio..." 
}: MunicipalityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  console.log('MunicipalityCombobox render - mpcaData length:', mpcaData.length);
  console.log('MunicipalityCombobox render - first item:', mpcaData[0]);
  console.log('MunicipalityCombobox render - selectedValue:', selectedValue);

  const selectedMunicipality = mpcaData.find(
    (mpca) => mpca.idm.toString() === selectedValue
  );

  // Filter municipalities based on search value
  const filteredMunicipalities = useMemo(() => {
    if (!searchValue.trim()) {
      return mpcaData;
    }
    
    const search = searchValue.toLowerCase().trim();
    console.log('Filtering with search term:', search);
    
    const filtered = mpcaData.filter((mpca) => {
      const municipioMatch = mpca.municipio?.toLowerCase().includes(search);
      const provinciaMatch = mpca.provincia?.toLowerCase().includes(search);
      const caMatch = mpca.ca?.toLowerCase().includes(search);
      
      return municipioMatch || provinciaMatch || caMatch;
    });
    
    console.log('Filtered results:', filtered.length, 'municipalities');
    return filtered;
  }, [mpcaData, searchValue]);

  return (
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
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Escribir nombre del municipio..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {mpcaData.length === 0 
                ? "No hay datos de municipios disponibles. Revisa la conexión a la base de datos." 
                : "No se encontraron municipios con ese criterio."}
            </CommandEmpty>
            <CommandGroup>
              {filteredMunicipalities.slice(0, 100).map((mpca) => (
                <CommandItem
                  key={mpca.idm}
                  value={mpca.municipio}
                  onSelect={() => {
                    console.log('Selected municipality:', mpca);
                    onSelect(mpca.idm.toString());
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === mpca.idm.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{mpca.municipio}</span>
                    <span className="text-xs text-muted-foreground">
                      {mpca.provincia}, {mpca.ca}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
