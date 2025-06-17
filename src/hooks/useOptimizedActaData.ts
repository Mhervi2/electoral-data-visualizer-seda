
import React from 'react';
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
    retryDelay: RETRY_DELAY
  });

  const {
    data: politicalParties = [],
    isLoading: partiesLoading,
    error: partiesError,
    refetch: refetchParties
  } = useQuery({
    queryKey: ['political-parties'],
    queryFn: async () => {
      console.log('Starting political parties query...');
      try {
        const result = await fetchPoliticalParties();
        console.log('Political parties query result:', result);
        return result;
      } catch (error) {
        console.error('Political parties query failed:', error);
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 3,
    retryDelay: RETRY_DELAY
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
    retryDelay: RETRY_DELAY
  });

  // Handle errors using useEffect instead of onError callback
  React.useEffect(() => {
    if (mpcaError) {
      console.error('MPCA data fetch error:', mpcaError);
      toast({
        variant: "destructive",
        title: "Error al cargar municipios",
        description: "Reintentando automáticamente...",
      });
    }
  }, [mpcaError, toast]);

  React.useEffect(() => {
    if (partiesError) {
      console.error('Political parties fetch error:', partiesError);
      toast({
        variant: "destructive",
        title: "Error al cargar partidos",
        description: getErrorMessage(partiesError),
      });
    }
  }, [partiesError, toast]);

  React.useEffect(() => {
    if (electionsError) {
      console.error('Elections fetch error:', electionsError);
      toast({
        variant: "destructive",
        title: "Error al cargar elecciones",
        description: "Reintentando automáticamente...",
      });
    }
  }, [electionsError, toast]);

  React.useEffect(() => {
    if (politicalParties.length > 0) {
      console.log('Political parties loaded successfully:', politicalParties);
    }
  }, [politicalParties]);

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

  // Enhanced logging for debugging
  console.log('OptimizedActaData detailed status:', {
    loading,
    error: errorMessage,
    mpcaData: {
      count: mpcaData.length,
      loading: mpcaLoading,
      error: mpcaError ? getErrorMessage(mpcaError) : null
    },
    politicalParties: {
      count: politicalParties.length,
      loading: partiesLoading,
      error: partiesError ? getErrorMessage(partiesError) : null,
      data: politicalParties
    },
    elections: {
      count: elections.length,
      loading: electionsLoading,
      error: electionsError ? getErrorMessage(electionsError) : null
    }
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
