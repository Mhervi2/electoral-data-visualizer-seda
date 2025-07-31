import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';
import { useDebounce } from '@/hooks/useDebounce';

export const useMunicipalitySearch = (searchTerm: string, delay: number = 300) => {
  const [municipalities, setMunicipalities] = useState<MpcaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    const searchMunicipalities = async () => {
      // Don't search if term is too short
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.trim().length < 2) {
        setMunicipalities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔍 Searching municipalities for:', debouncedSearchTerm);

        const searchPattern = `%${debouncedSearchTerm.toLowerCase()}%`;
        
        const { data, error: queryError } = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca')
          .or(`municipio.ilike.${searchPattern},provincia.ilike.${searchPattern},ca.ilike.${searchPattern}`)
          .order('municipio', { ascending: true })
          .limit(100); // Limit to 100 results for performance

        if (queryError) {
          console.error('❌ Search error:', queryError);
          setError('Error al buscar municipios');
          setMunicipalities([]);
          return;
        }

        const formattedData: MpcaData[] = (data || []).map(item => ({
          idm: Number(item.idm),
          municipio: item.municipio || '',
          idp: Number(item.idp) || 0,
          provincia: item.provincia || '',
          idca: Number(item.idca) || 0,
          ca: item.ca || '',
        }));

        // Sort results to prioritize exact matches and starts-with matches
        const sorted = formattedData.sort((a, b) => {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const aExactMatch = a.municipio?.toLowerCase() === searchLower;
          const bExactMatch = b.municipio?.toLowerCase() === searchLower;
          const aStartsWithMatch = a.municipio?.toLowerCase().startsWith(searchLower);
          const bStartsWithMatch = b.municipio?.toLowerCase().startsWith(searchLower);
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          if (aStartsWithMatch && !bStartsWithMatch) return -1;
          if (!aStartsWithMatch && bStartsWithMatch) return 1;
          
          return a.municipio?.localeCompare(b.municipio || '') || 0;
        });

        console.log(`✅ Found ${sorted.length} municipalities`);
        setMunicipalities(sorted);

      } catch (err: any) {
        console.error('💥 Search error:', err);
        setError(err.message || 'Error desconocido al buscar municipios');
        setMunicipalities([]);
      } finally {
        setLoading(false);
      }
    };

    searchMunicipalities();
  }, [debouncedSearchTerm]);

  return {
    municipalities,
    loading,
    error,
    hasSearched: debouncedSearchTerm.trim().length >= 2
  };
};