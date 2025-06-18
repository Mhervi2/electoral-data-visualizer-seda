
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
        .select('comunidad_autonoma, provincia, municipio, district, section, table_letter');

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
      if (currentFilters.district?.trim()) {
        const trimmedValue = currentFilters.district.trim();
        console.log('📍 Filtering by District:', trimmedValue);
        query = query.eq('district', trimmedValue);
      }
      if (currentFilters.section?.trim()) {
        const trimmedValue = currentFilters.section.trim();
        console.log('📍 Filtering by Section:', trimmedValue);
        query = query.eq('section', trimmedValue);
      }
      if (currentFilters.table?.trim()) {
        const trimmedValue = currentFilters.table.trim();
        console.log('📍 Filtering by Table:', trimmedValue);
        query = query.eq('table_letter', trimmedValue);
      }
      if (currentFilters.sourceTypes.length > 0) {
        console.log('📍 Filtering by Source Types:', currentFilters.sourceTypes);
        query = query.in('source_type', currentFilters.sourceTypes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching filter options:', error);
        return;
      }

      console.log('✅ Raw filter data loaded:', data?.length || 0);

      if (data) {
        // Extraer valores únicos para cada filtro (con trim para limpiar)
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
          districts: [...new Set(data
            .map(item => item.district?.trim())
            .filter(Boolean)
            .sort()
          )],
          sections: [...new Set(data
            .map(item => item.section?.trim())
            .filter(Boolean)
            .sort()
          )],
          tables: [...new Set(data
            .map(item => item.table_letter?.trim())
            .filter(Boolean)
            .sort()
          )]
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
