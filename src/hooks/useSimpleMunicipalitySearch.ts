import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';
import { useDebounce } from '@/hooks/useDebounce';

export const useSimpleMunicipalitySearch = (searchTerm: string, delay: number = 300) => {
  const [municipalities, setMunicipalities] = useState<MpcaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    const searchMunicipalities = async () => {
      // Clear results if search term is too short
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.trim().length < 2) {
        setMunicipalities([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔍 Searching municipalities for:', debouncedSearchTerm);
        
        // Simple ILIKE search - more reliable than full-text search
        const searchPattern = `%${debouncedSearchTerm.toLowerCase().trim()}%`;
        
        const { data, error: queryError } = await supabase
          .from('mpca')
          .select('idm, municipio, provincia, ca, idp, idca, idc')
          .or(`municipio.ilike.${searchPattern},provincia.ilike.${searchPattern},ca.ilike.${searchPattern}`)
          .order('municipio', { ascending: true })
          .limit(150);

        if (queryError) {
          console.error('❌ Search error:', queryError);
          setError('Error al buscar municipios. Inténtalo de nuevo.');
          setMunicipalities([]);
          return;
        }

        const formattedData: MpcaData[] = (data || []).map(item => ({
          idm: Number(item.idm) || 0,
          municipio: item.municipio || '',
          idp: Number(item.idp) || 0,
          provincia: item.provincia || '',
          idca: Number(item.idca) || 0,
          ca: item.ca || '',
          idc: item.idc || '',
        }));

        // Sort results to prioritize exact matches and municipality name starts-with
        const sorted = formattedData.sort((a, b) => {
          const searchLower = debouncedSearchTerm.toLowerCase();
          
          // First priority: exact municipality name match
          const aMunicipalityExact = a.municipio?.toLowerCase() === searchLower;
          const bMunicipalityExact = b.municipio?.toLowerCase() === searchLower;
          if (aMunicipalityExact && !bMunicipalityExact) return -1;
          if (!aMunicipalityExact && bMunicipalityExact) return 1;
          
          // Second priority: municipality name starts with search
          const aMunicipalityStartsWith = a.municipio?.toLowerCase().startsWith(searchLower);
          const bMunicipalityStartsWith = b.municipio?.toLowerCase().startsWith(searchLower);
          if (aMunicipalityStartsWith && !bMunicipalityStartsWith) return -1;
          if (!aMunicipalityStartsWith && bMunicipalityStartsWith) return 1;
          
          // Third priority: municipality name contains search
          const aMunicipalityContains = a.municipio?.toLowerCase().includes(searchLower);
          const bMunicipalityContains = b.municipio?.toLowerCase().includes(searchLower);
          if (aMunicipalityContains && !bMunicipalityContains) return -1;
          if (!aMunicipalityContains && bMunicipalityContains) return 1;
          
          // Final priority: alphabetical order
          return a.municipio?.localeCompare(b.municipio || '') || 0;
        });

        console.log(`✅ Found ${sorted.length} municipalities`);
        setMunicipalities(sorted);

      } catch (err: any) {
        console.error('💥 Search error:', err);
        setError('Error de conexión. Verifica tu conexión e inténtalo de nuevo.');
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