import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData } from '@/types/acta';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchParams {
  searchTerm?: string;
  provincia?: string;
  ca?: string;
  page?: number;
  pageSize?: number;
}

interface SearchResult {
  municipalities: MpcaData[];
  hasMore: boolean;
  totalCount: number;
}

export const useOptimizedMunicipalitySearch = (
  searchParams: SearchParams,
  delay: number = 300
) => {
  const [result, setResult] = useState<SearchResult>({
    municipalities: [],
    hasMore: false,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchParams.searchTerm || '', delay);
  const { provincia, ca, page = 0, pageSize = 50 } = searchParams;

  useEffect(() => {
    const searchMunicipalities = async () => {
      // Reset if no search criteria
      if (!debouncedSearchTerm.trim() && !provincia && !ca) {
        setResult({ municipalities: [], hasMore: false, totalCount: 0 });
        setLoading(false);
        return;
      }

      // Don't search if term is too short and no filters
      if (debouncedSearchTerm.trim().length > 0 && debouncedSearchTerm.trim().length < 2 && !provincia && !ca) {
        setResult({ municipalities: [], hasMore: false, totalCount: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('mpca_search_optimized')
          .select('idm, municipio, provincia, ca, idp, idca, idc', { count: 'exact' });

        // Apply filters
        if (ca) {
          query = query.eq('ca', ca);
        }
        
        if (provincia) {
          query = query.eq('provincia', provincia);
        }

        // Apply text search
        if (debouncedSearchTerm.trim().length >= 2) {
          // Use full-text search for better performance
          const searchQuery = debouncedSearchTerm
            .trim()
            .split(' ')
            .map(term => `${term}:*`)
            .join(' & ');
          
          query = query.textSearch('search_vector', searchQuery);
        }

        // Apply pagination
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        query = query
          .order('municipio', { ascending: true })
          .range(from, to);

        const { data, error: queryError, count } = await query;

        if (queryError) {
          console.error('❌ Search error:', queryError);
          setError('Error al buscar municipios');
          setResult({ municipalities: [], hasMore: false, totalCount: 0 });
          return;
        }

        const formattedData: MpcaData[] = (data || []).map(item => ({
          idm: Number(item.idm),
          municipio: item.municipio || '',
          idp: Number(item.idp) || 0,
          provincia: item.provincia || '',
          idca: Number(item.idca) || 0,
          ca: item.ca || '',
          idc: item.idc || '',
        }));

        const totalCount = count || 0;
        const hasMore = (page + 1) * pageSize < totalCount;

        // If this is page 0, replace the results, otherwise append
        setResult(prevResult => ({
          municipalities: page === 0 ? formattedData : [...prevResult.municipalities, ...formattedData],
          hasMore,
          totalCount,
        }));

        console.log(`✅ Found ${formattedData.length} municipalities (page ${page + 1}, total: ${totalCount})`);

      } catch (err: any) {
        console.error('💥 Search error:', err);
        setError(err.message || 'Error desconocido al buscar municipios');
        setResult({ municipalities: [], hasMore: false, totalCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    searchMunicipalities();
  }, [debouncedSearchTerm, provincia, ca, page, pageSize]);

  const loadMore = () => {
    if (!loading && result.hasMore) {
      // This will trigger the effect with an incremented page
      return { ...searchParams, page: (searchParams.page || 0) + 1 };
    }
    return searchParams;
  };

  return {
    municipalities: result.municipalities,
    hasMore: result.hasMore,
    totalCount: result.totalCount,
    loading,
    error,
    loadMore,
    hasSearched: debouncedSearchTerm.trim().length >= 2 || Boolean(provincia || ca)
  };
};