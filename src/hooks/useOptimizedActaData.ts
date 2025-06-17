
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getConnectionStatus } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchMpcaData } from '@/services/mpcaService';
import { fetchPoliticalParties } from '@/services/politicalPartiesService';
import { fetchElections } from '@/services/electionsService';
import { getErrorMessage } from '@/utils/errorUtils';
import { QUERY_STALE_TIME, QUERY_CACHE_TIME, RETRY_DELAY } from '@/config/queryConfig';

export const useOptimizedActaData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check connection status before starting queries
  console.log('Supabase connection status:', getConnectionStatus());

  const {
    data: mpcaData = [],
    isLoading: mpcaLoading,
    error: mpcaError,
    refetch: refetchMpca
  } = useQuery({
    queryKey: ['mpca-data'],
    queryFn: fetchMpcaData,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 3,
    retryDelay: RETRY_DELAY,
    meta: {
      onError: (error: any) => {
        console.error('MPCA data fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar municipios",
          description: "Reintentando automáticamente...",
        });
      }
    }
  });

  const {
    data: politicalParties = [],
    isLoading: partiesLoading,
    error: partiesError,
    refetch: refetchParties
  } = useQuery({
    queryKey: ['political-parties'],
    queryFn: fetchPoliticalParties,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 3,
    retryDelay: RETRY_DELAY,
    meta: {
      onError: (error: any) => {
        console.error('Political parties fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar partidos",
          description: "Reintentando automáticamente...",
        });
      }
    }
  });

  const {
    data: elections = [],
    isLoading: electionsLoading,
    error: electionsError,
    refetch: refetchElections
  } = useQuery({
    queryKey: ['elections'],
    queryFn: fetchElections,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 3,
    retryDelay: RETRY_DELAY,
    meta: {
      onError: (error: any) => {
        console.error('Elections fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar elecciones",
          description: "Reintentando automáticamente...",
        });
      }
    }
  });

  const refetchAll = async () => {
    try {
      console.log('Refetching all data...');
      await Promise.allSettled([
        refetchMpca(),
        refetchParties(),
        refetchElections()
      ]);
      toast({
        title: "Datos actualizados",
        description: "Los datos se han recargado correctamente.",
      });
    } catch (error) {
      console.error('Error refetching data:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudieron actualizar todos los datos.",
      });
    }
  };

  const loading = mpcaLoading || partiesLoading || electionsLoading;
  const error = mpcaError || partiesError || electionsError;
  const errorMessage = error ? getErrorMessage(error) : null;

  // Log current data status
  console.log('OptimizedActaData status:', {
    loading,
    error: errorMessage,
    mpcaCount: mpcaData.length,
    partiesCount: politicalParties.length,
    electionsCount: elections.length
  });

  return {
    mpcaData,
    politicalParties,
    elections,
    loading,
    error: errorMessage,
    refetch: refetchAll,
    // Individual refetch functions
    refetchMpca,
    refetchParties,
    refetchElections
  };
};
