
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

  console.log('MunicipalityCombobox - mpcaData:', mpcaData.length, 'items');
  console.log('MunicipalityCombobox - first few items:', mpcaData.slice(0, 3));

  const selectedMunicipality = mpcaData.find(
    (mpca) => mpca.idm.toString() === selectedValue
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
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Escribir nombre del municipio..." 
          />
          <CommandList>
            <CommandEmpty>No se encontraron municipios.</CommandEmpty>
            <CommandGroup>
              {mpcaData.map((mpca) => (
                <CommandItem
                  key={mpca.idm}
                  value={mpca.municipio}
                  keywords={[mpca.municipio.toLowerCase(), mpca.provincia.toLowerCase()]}
                  onSelect={() => {
                    console.log('Selected municipality:', mpca);
                    onSelect(mpca.idm.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === mpca.idm.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{mpca.municipio}</span>
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
