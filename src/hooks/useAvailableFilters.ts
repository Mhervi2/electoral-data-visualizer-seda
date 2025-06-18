
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
      console.log('🔍 Fetching available filter options with current filters:', currentFilters);

      // Construir la consulta base
      let query = supabase
        .from('electoral_acts_with_municipalities')
        .select('comunidad_autonoma, provincia, municipio, district, section, table_letter');

      // Aplicar filtros existentes para obtener opciones válidas
      if (currentFilters.autonomousCommunity) {
        query = query.eq('comunidad_autonoma', currentFilters.autonomousCommunity);
      }
      if (currentFilters.province) {
        query = query.eq('provincia', currentFilters.province);
      }
      if (debouncedMunicipality.trim()) {
        query = query.ilike('municipio', `%${debouncedMunicipality.trim()}%`);
      }
      if (currentFilters.district) {
        query = query.eq('district', currentFilters.district);
      }
      if (currentFilters.section) {
        query = query.eq('section', currentFilters.section);
      }
      if (currentFilters.table) {
        query = query.eq('table_letter', currentFilters.table);
      }
      if (currentFilters.sourceTypes.length > 0) {
        query = query.in('source_type', currentFilters.sourceTypes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching filter options:', error);
        return;
      }

      console.log('✅ Raw filter data loaded:', data?.length || 0);

      if (data) {
        // Extraer valores únicos para cada filtro
        const uniqueOptions: FilterOptions = {
          autonomousCommunities: [...new Set(data
            .map(item => item.comunidad_autonoma)
            .filter(Boolean)
            .sort()
          )],
          provinces: [...new Set(data
            .map(item => item.provincia)
            .filter(Boolean)
            .sort()
          )],
          municipalities: [...new Set(data
            .map(item => item.municipio)
            .filter(Boolean)
            .sort()
          )],
          districts: [...new Set(data
            .map(item => item.district)
            .filter(Boolean)
            .sort()
          )],
          sections: [...new Set(data
            .map(item => item.section)
            .filter(Boolean)
            .sort()
          )],
          tables: [...new Set(data
            .map(item => item.table_letter)
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
      // Comunidades autónomas siempre disponibles
      autonomousCommunities: options.autonomousCommunities,
      
      // Provincias filtradas por CA seleccionada
      provinces: currentFilters.autonomousCommunity 
        ? options.provinces 
        : options.provinces,
        
      // Municipios filtrados por provincia seleccionada
      municipalities: options.municipalities,
      
      // Distritos, secciones y mesas filtrados por selecciones anteriores
      districts: options.districts,
      sections: options.sections,
      tables: options.tables
    };
  }, [options, currentFilters.autonomousCommunity, currentFilters.province]);

  return {
    options: filteredOptions,
    loading,
    refetch: fetchFilterOptions
  };
};
