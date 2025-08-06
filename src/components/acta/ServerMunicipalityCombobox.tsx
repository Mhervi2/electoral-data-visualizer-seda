import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MpcaData } from '@/types/acta';
import { useMunicipalitySearch } from '@/hooks/useMunicipalitySearch';

interface ServerMunicipalityComboboxProps {
  selectedValue: string;
  onSelect: (value: string, municipalityData?: MpcaData) => void;
  placeholder?: string;
}

export const ServerMunicipalityCombobox = ({ 
  selectedValue, 
  onSelect, 
  placeholder = "Buscar municipio..." 
}: ServerMunicipalityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<MpcaData | null>(null);

  const { municipalities, loading, error, hasSearched } = useMunicipalitySearch(searchValue);

  console.log('ServerMunicipalityCombobox render - selectedValue:', selectedValue);
  console.log('ServerMunicipalityCombobox render - search results:', municipalities.length);

  // Get selected municipality data if needed
  React.useEffect(() => {
    if (selectedValue && !selectedMunicipality) {
      // If we have a selected value but no municipality data, search for it
      const searchForSelected = async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca, idc')
          .eq('idm', Number(selectedValue))
          .single();
        
        if (data) {
          setSelectedMunicipality({
            idm: Number(data.idm),
            municipio: data.municipio || '',
            idp: Number(data.idp) || 0,
            provincia: data.provincia || '',
            idca: Number(data.idca) || 0,
            ca: data.ca || '',
            idc: data.idc || '',
          });
        }
      };
      searchForSelected();
    }
  }, [selectedValue, selectedMunicipality]);

  const handleSelect = (municipality: MpcaData) => {
    console.log('Selected municipality:', municipality);
    setSelectedMunicipality(municipality);
    onSelect(municipality.idm.toString(), municipality);
    setOpen(false);
    setSearchValue('');
  };

  const getEmptyMessage = () => {
    if (error) {
      return `Error: ${error}`;
    }
    if (!hasSearched) {
      return "Escribe al menos 2 caracteres para buscar...";
    }
    if (loading) {
      return "Buscando municipios...";
    }
    return "No se encontraron municipios con ese criterio.";
  };

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
      <PopoverContent className="w-full p-0 z-[100] bg-popover" align="start">
        <Command>
          <CommandInput 
            placeholder="Escribe al menos 2 caracteres..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>
              <div className="flex items-center justify-center py-2">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getEmptyMessage()}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {municipalities.map((mpca) => (
                <CommandItem
                  key={mpca.idm}
                  value={mpca.municipio}
                  onSelect={() => handleSelect(mpca)}
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
                      {mpca.provincia} • {mpca.ca}
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