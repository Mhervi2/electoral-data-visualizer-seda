
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterOptions {
  autonomousCommunities: string[];
  provinces: string[];
  municipalities: string[];
  districts: string[];
  sections: string[];
  tables: string[];
}

interface Filters {
  autonomousCommunity: string;
  province: string;
  municipality: string;
  district: string;
  section: string;
  table: string;
  sourceTypes: string[];
}

export const useAvailableFilters = (currentFilters: Filters) => {
  const [options, setOptions] = useState<FilterOptions>({
    autonomousCommunities: [],
    provinces: [],
    municipalities: [],
    districts: [],
    sections: [],
    tables: []
  });
  const [loading, setLoading] = useState(false);

  // Debounce los filtros de texto para evitar consultas excesivas
  const debouncedMunicipality = useDebounce(currentFilters.municipality, 300);

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching available filter options with current filters:', {
        ...currentFilters,
        municipality: debouncedMunicipality
      });

      // Construir la consulta base
      let query = supabase
        .from('electoral_acts_with_municipalities')
        .select('comunidad_autonoma, provincia, municipio, mesa_identifier');

      // Aplicar filtros existentes para obtener opciones válidas (con trim para consistencia)
      if (currentFilters.autonomousCommunity?.trim()) {
        const trimmedValue = currentFilters.autonomousCommunity.trim();
        console.log('📍 Filtering by CA:', trimmedValue);
        query = query.eq('comunidad_autonoma', trimmedValue);
      }
      if (currentFilters.province?.trim()) {
        const trimmedValue = currentFilters.province.trim();
        console.log('📍 Filtering by Province:', trimmedValue);
        query = query.eq('provincia', trimmedValue);
      }
      if (debouncedMunicipality?.trim()) {
        const trimmedValue = debouncedMunicipality.trim();
        console.log('📍 Filtering by Municipality:', trimmedValue);
        query = query.ilike('municipio', `%${trimmedValue}%`);
      }
      if (currentFilters.sourceTypes.length > 0) {
        // Expand 'user' filter to include 'real-data' automatically
        const expandedSourceTypes = [...currentFilters.sourceTypes];
        if (currentFilters.sourceTypes.includes('user') && !currentFilters.sourceTypes.includes('real-data')) {
          expandedSourceTypes.push('real-data');
        }
        
        console.log('📍 Filtering by Source Types:', currentFilters.sourceTypes, '→ Expanded:', expandedSourceTypes);
        query = query.in('source_type', expandedSourceTypes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching filter options:', error);
        return;
      }

      console.log('✅ Raw filter data loaded:', data?.length || 0);

      if (data) {
        // Extraer valores únicos para cada filtro (con trim para limpiar)
        const districts = new Set<string>();
        const sections = new Set<string>();
        const tables = new Set<string>();

        data.forEach(item => {
          if (item.mesa_identifier) {
            const { district, section, table } = parseMesaIdentifier(item.mesa_identifier);
            
            // Solo agregar si coincide con los filtros aplicados
            let shouldInclude = true;
            
            if (currentFilters.district?.trim() && district !== currentFilters.district.trim()) {
              shouldInclude = false;
            }
            if (currentFilters.section?.trim() && section !== currentFilters.section.trim()) {
              shouldInclude = false;
            }
            if (currentFilters.table?.trim() && table !== currentFilters.table.trim()) {
              shouldInclude = false;
            }
            
            if (shouldInclude) {
              if (district) districts.add(district);
              if (section) sections.add(section);
              if (table) tables.add(table);
            }
          }
        });

        const uniqueOptions: FilterOptions = {
          autonomousCommunities: [...new Set(data
            .map(item => item.comunidad_autonoma?.trim())
            .filter(Boolean)
            .sort()
          )],
          provinces: [...new Set(data
            .map(item => item.provincia?.trim())
            .filter(Boolean)
            .sort()
          )],
          municipalities: [...new Set(data
            .map(item => item.municipio?.trim())
            .filter(Boolean)
            .sort()
          )],
          districts: [...districts].sort(),
          sections: [...sections].sort(),
          tables: [...tables].sort()
        };

        console.log('📊 Unique options extracted:', {
          autonomousCommunities: uniqueOptions.autonomousCommunities.length,
          provinces: uniqueOptions.provinces.length,
          municipalities: uniqueOptions.municipalities.length,
          districts: uniqueOptions.districts.length,
          sections: uniqueOptions.sections.length,
          tables: uniqueOptions.tables.length
        });

        setOptions(uniqueOptions);
      }
    } catch (error) {
      console.error('💥 Error in fetchFilterOptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [
    currentFilters.autonomousCommunity,
    currentFilters.province,
    debouncedMunicipality,
    currentFilters.district,
    currentFilters.section,
    currentFilters.table,
    currentFilters.sourceTypes
  ]);

  // Memoizar las opciones filtradas para evitar recálculos innecesarios
  const filteredOptions = useMemo(() => {
    return {
      autonomousCommunities: options.autonomousCommunities,
      provinces: options.provinces,
      municipalities: options.municipalities,
      districts: options.districts,
      sections: options.sections,
      tables: options.tables
    };
  }, [options]);

  return {
    options: filteredOptions,
    loading,
    refetch: fetchFilterOptions
  };
};
