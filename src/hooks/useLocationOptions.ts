
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationOptions {
  autonomousCommunities: string[];
  provinces: string[];
  loading: boolean;
}

export const useLocationOptions = (selectedCommunity?: string) => {
  const [options, setOptions] = useState<LocationOptions>({
    autonomousCommunities: [],
    provinces: [],
    loading: true
  });

  useEffect(() => {
    const fetchLocationOptions = async () => {
      try {
        // Obtener comunidades autónomas únicas
        const { data: caData, error: caError } = await supabase
          .from('electoral_acts_with_municipalities')
          .select('comunidad_autonoma')
          .not('comunidad_autonoma', 'is', null);

        if (caError) {
          console.error('Error fetching autonomous communities:', caError);
        }

        const uniqueCommunities = Array.from(
          new Set(caData?.map(item => item.comunidad_autonoma).filter(Boolean))
        ).sort();

        // Obtener provincias (filtradas por comunidad si está seleccionada)
        let provincesQuery = supabase
          .from('electoral_acts_with_municipalities')
          .select('provincia')
          .not('provincia', 'is', null);

        if (selectedCommunity) {
          provincesQuery = provincesQuery.eq('comunidad_autonoma', selectedCommunity);
        }

        const { data: provincesData, error: provincesError } = await provincesQuery;

        if (provincesError) {
          console.error('Error fetching provinces:', provincesError);
        }

        const uniqueProvinces = Array.from(
          new Set(provincesData?.map(item => item.provincia).filter(Boolean))
        ).sort();

        setOptions({
          autonomousCommunities: uniqueCommunities,
          provinces: uniqueProvinces,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching location options:', error);
        setOptions(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLocationOptions();
  }, [selectedCommunity]);

  return options;
};
