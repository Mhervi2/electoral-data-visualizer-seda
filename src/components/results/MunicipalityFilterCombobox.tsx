import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MunicipalityFilterComboboxProps {
  municipalities: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MunicipalityFilterCombobox = ({ 
  municipalities, 
  selectedValue, 
  onSelect, 
  placeholder = "Seleccionar municipio...",
  disabled = false
}: MunicipalityFilterComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filter municipalities based on search value with optimized search
  const filteredMunicipalities = useMemo(() => {
    if (!searchValue.trim()) {
      return municipalities;
    }
    
    const search = searchValue.toLowerCase().trim();
    const filtered = municipalities.filter((municipality) => 
      municipality.toLowerCase().includes(search)
    );

    // Sort results to prioritize exact matches
    return filtered.sort((a, b) => {
      const aExactMatch = a.toLowerCase() === search;
      const bExactMatch = b.toLowerCase() === search;
      const aStartsWithMatch = a.toLowerCase().startsWith(search);
      const bStartsWithMatch = b.toLowerCase().startsWith(search);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      if (aStartsWithMatch && !bStartsWithMatch) return -1;
      if (!aStartsWithMatch && bStartsWithMatch) return 1;
      
      return a.localeCompare(b);
    });
  }, [municipalities, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedValue && selectedValue !== "all"
            ? selectedValue
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[100] bg-popover" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar municipio..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>
              No se encontraron municipios con ese criterio.
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelect("all");
                  setOpen(false);
                  setSearchValue('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValue === "all" || !selectedValue ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos los municipios
              </CommandItem>
              {filteredMunicipalities.slice(0, 500).map((municipality) => (
                <CommandItem
                  key={municipality}
                  value={municipality}
                  onSelect={() => {
                    onSelect(municipality);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === municipality ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {municipality}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};