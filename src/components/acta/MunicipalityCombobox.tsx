
import React, { useState } from 'react';
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

  const selectedMunicipality = mpcaData.find(
    (mpca) => mpca.idm.toString() === selectedValue
  );

  const filteredMunicipalities = mpcaData.filter((mpca) =>
    mpca.municipio.toLowerCase().includes(searchValue.toLowerCase())
  );

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
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Escribir nombre del municipio..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron municipios.</CommandEmpty>
            <CommandGroup>
              {filteredMunicipalities.map((mpca) => (
                <CommandItem
                  key={mpca.idm}
                  value={mpca.municipio}
                  onSelect={() => {
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
                  {mpca.municipio}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
