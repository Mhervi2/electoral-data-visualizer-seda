import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MpcaData } from "@/types/acta";
import { useGeographicalHierarchy } from "@/hooks/useGeographicalHierarchy";
import { useOptimizedMunicipalitySearch } from "@/hooks/useOptimizedMunicipalitySearch";

interface HierarchicalMunicipalityComboboxProps {
  selectedValue: string;
  onSelect: (municipalityId: string, municipalityData: MpcaData | null) => void;
  placeholder?: string;
}

export function HierarchicalMunicipalityCombobox({
  selectedValue,
  onSelect,
  placeholder = "Seleccionar municipio..."
}: HierarchicalMunicipalityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCA, setSelectedCA] = useState("");
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<MpcaData | null>(null);

  const { 
    comunidades, 
    provincias, 
    loadingComunidades, 
    loadingProvincias, 
    loadProvinciasByCA 
  } = useGeographicalHierarchy();

  const { 
    municipalities, 
    loading: loadingMunicipalities, 
    hasMore,
    loadMore 
  } = useOptimizedMunicipalitySearch({
    searchTerm: searchValue,
    ca: selectedCA,
    provincia: selectedProvincia,
    pageSize: 50
  });

  // Reset dependent selections when parent changes
  useEffect(() => {
    if (selectedCA) {
      loadProvinciasByCA(Number(selectedCA));
      setSelectedProvincia(""); // Reset provincia when CA changes
    }
  }, [selectedCA, loadProvinciasByCA]);

  useEffect(() => {
    if (selectedProvincia) {
      setSearchValue(""); // Reset search when provincia changes
    }
  }, [selectedProvincia]);

  // Find selected municipality details
  useEffect(() => {
    if (selectedValue && !selectedMunicipality) {
      // Try to find in current results first
      const found = municipalities.find(m => String(m.idm) === selectedValue);
      if (found) {
        setSelectedMunicipality(found);
      }
    }
  }, [selectedValue, municipalities, selectedMunicipality]);

  const handleSelect = (municipality: MpcaData) => {
    setSelectedMunicipality(municipality);
    onSelect(String(municipality.idm), municipality);
    setOpen(false);
    setSearchValue("");
  };

  const getDisplayText = () => {
    if (selectedMunicipality) {
      return `${selectedMunicipality.municipio} (${selectedMunicipality.provincia})`;
    }
    return placeholder;
  };

  const filteredProvincias = useMemo(() => {
    return provincias.filter(p => 
      selectedCA ? String(p.idca) === selectedCA : true
    );
  }, [provincias, selectedCA]);

  return (
    <div className="space-y-2">
      {/* Hierarchical filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium mb-1 block">Comunidad Autónoma</label>
          <Select value={selectedCA} onValueChange={setSelectedCA}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar CA..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las comunidades</SelectItem>
              {loadingComunidades ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando...
                </SelectItem>
              ) : (
                comunidades.map((ca) => (
                  <SelectItem key={ca.idca} value={String(ca.idca)}>
                    {ca.ca} ({ca.total_municipios})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Provincia</label>
          <Select 
            value={selectedProvincia} 
            onValueChange={setSelectedProvincia}
            disabled={!selectedCA}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar provincia..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las provincias</SelectItem>
              {loadingProvincias ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando...
                </SelectItem>
              ) : (
                filteredProvincias.map((provincia) => (
                  <SelectItem key={provincia.idp} value={provincia.provincia}>
                    {provincia.provincia} ({provincia.total_municipios})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Municipality search */}
      <div>
        <label className="text-sm font-medium mb-1 block">Municipio</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={!selectedProvincia && !searchValue}
            >
              {getDisplayText()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar municipio..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  {loadingMunicipalities ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Buscando municipios...
                    </div>
                  ) : (
                    <div className="p-4 text-sm">
                      {!selectedProvincia && !searchValue 
                        ? "Selecciona una provincia o busca por nombre"
                        : "No se encontraron municipios"
                      }
                    </div>
                  )}
                </CommandEmpty>
                {municipalities.length > 0 && (
                  <CommandGroup>
                    {municipalities.map((municipality) => (
                      <CommandItem
                        key={municipality.idm}
                        value={`${municipality.municipio} ${municipality.provincia}`}
                        onSelect={() => handleSelect(municipality)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedValue === String(municipality.idm) 
                              ? "opacity-100" 
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{municipality.municipio}</span>
                          <span className="text-sm text-muted-foreground">
                            {municipality.provincia} • {municipality.ca}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                    {hasMore && (
                      <CommandItem 
                        onSelect={() => loadMore()}
                        className="text-center text-sm text-muted-foreground"
                      >
                        {loadingMunicipalities ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Cargando más...
                          </>
                        ) : (
                          "Cargar más resultados..."
                        )}
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}