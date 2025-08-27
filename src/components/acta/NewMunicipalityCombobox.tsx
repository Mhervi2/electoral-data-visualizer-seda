import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MpcaData } from '@/types/acta';
import { useSimpleMunicipalitySearch } from '@/hooks/useSimpleMunicipalitySearch';
import { supabase } from '@/integrations/supabase/client';

interface NewMunicipalityComboboxProps {
  selectedValue: string;
  onSelect: (municipalityId: string, municipalityData?: MpcaData) => void;
  placeholder?: string;
}

export const NewMunicipalityCombobox = ({ 
  selectedValue, 
  onSelect, 
  placeholder = "Buscar municipio..." 
}: NewMunicipalityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<MpcaData | null>(null);

  const { municipalities, loading, error, hasSearched } = useSimpleMunicipalitySearch(searchValue);

  // Fetch selected municipality data when selectedValue changes
  useEffect(() => {
    const fetchSelectedMunicipality = async () => {
      if (selectedValue && !selectedMunicipality) {
        try {
          const { data, error } = await supabase
            .from('mpca')
            .select('idm, municipio, provincia, ca, idp, idca, idc')
            .eq('idm', Number(selectedValue))
            .single();

          if (data && !error) {
            const municipalityData: MpcaData = {
              idm: Number(data.idm),
              municipio: data.municipio || '',
              idp: Number(data.idp) || 0,
              provincia: data.provincia || '',
              idca: Number(data.idca) || 0,
              ca: data.ca || '',
              idc: data.idc || '',
            };
            setSelectedMunicipality(municipalityData);
          }
        } catch (err) {
          console.error('Error fetching selected municipality:', err);
        }
      }
    };

    fetchSelectedMunicipality();
  }, [selectedValue, selectedMunicipality]);

  const handleSelect = (municipality: MpcaData) => {
    console.log('Municipality selected:', municipality);
    setSelectedMunicipality(municipality);
    onSelect(municipality.idm.toString(), municipality);
    setOpen(false);
    setSearchValue('');
  };

  const getDisplayText = () => {
    if (selectedMunicipality) {
      return `${selectedMunicipality.municipio} (${selectedMunicipality.provincia}, ${selectedMunicipality.ca})`;
    }
    return placeholder;
  };

  const getEmptyMessage = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando municipios...
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center gap-2 py-6 text-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      );
    }
    
    if (!hasSearched) {
      return (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Escribe al menos 2 letras para buscar
        </div>
      );
    }
    
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No se encontraron municipios
      </div>
    );
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
          <span className="truncate">
            {selectedValue ? getDisplayText() : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[100]" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar por municipio, provincia o comunidad..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {getEmptyMessage()}
            </CommandEmpty>
            {municipalities.length > 0 && (
              <CommandGroup>
                {municipalities.map((municipality) => (
                  <CommandItem
                    key={municipality.idm}
                    value={municipality.idm.toString()}
                    onSelect={() => handleSelect(municipality)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedValue === municipality.idm.toString() 
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};