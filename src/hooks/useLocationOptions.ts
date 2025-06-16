
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
        console.log('Fetching location options...');
        
        // Obtener comunidades autónomas únicas desde mpca
        const { data: caData, error: caError } = await supabase
          .from('mpca')
          .select('ca')
          .not('ca', 'is', null);

        if (caError) {
          console.error('Error fetching autonomous communities:', caError);
        }

        const uniqueCommunities = Array.from(
          new Set(caData?.map(item => item.ca).filter(Boolean))
        ).sort();

        console.log('Autonomous communities loaded:', uniqueCommunities);

        // Obtener provincias (filtradas por comunidad si está seleccionada)
        let provincesQuery = supabase
          .from('mpca')
          .select('provincia')
          .not('provincia', 'is', null);

        if (selectedCommunity) {
          provincesQuery = provincesQuery.eq('ca', selectedCommunity);
        }

        const { data: provincesData, error: provincesError } = await provincesQuery;

        if (provincesError) {
          console.error('Error fetching provinces:', provincesError);
        }

        const uniqueProvinces = Array.from(
          new Set(provincesData?.map(item => item.provincia).filter(Boolean))
        ).sort();

        console.log('Provinces loaded:', uniqueProvinces);

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
