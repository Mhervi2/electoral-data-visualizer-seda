
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MpcaData, PoliticalParty, Election } from '@/types/acta';
import { useToast } from '@/hooks/use-toast';

const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

export const useOptimizedActaData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

const fetchMpcaData = async (): Promise<MpcaData[]> => {
  console.log("Fetching MPCA data...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from('mpca')
      .select('idm, municipio, provincia, ca, idp, idca')
      .order('municipio', { ascending: true });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Error de base de datos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No MPCA data returned');
      return [];
    }

    console.log(`MPCA data fetched successfully: ${data.length} records.`);
    return data.map(item => ({
      idm: Number(item.idm) || 0,
      municipio: item.municipio || '',
      idp: Number(item.idp) || 0,
      provincia: item.provincia || '',
      idca: Number(item.idca) || 0,
      ca: item.ca || '',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};

const fetchPoliticalParties = async (): Promise<PoliticalParty[]> => {
  console.log("Fetching political parties...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from('political_parties')
      .select('id, name, siglas')
      .order('siglas', { ascending: true });
    
    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Error al cargar los partidos políticos: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No political parties found');
      return [];
    }

    console.log(`Political parties fetched successfully: ${data.length} records.`);
    return data.map(party => ({
      id: party.id,
      name: party.name || '',
      siglas: party.siglas || '',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};

const fetchElections = async (): Promise<Election[]> => {
  console.log("Fetching elections...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from('elections')
      .select('id, name, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Error al cargar las elecciones: ${error.message}`);
    }

    if (!data) {
      console.warn('No elections found');
      return [];
    }

    console.log(`Elections fetched successfully: ${data.length} records.`);
    return data.map(election => ({
      id: election.id,
      name: election.name || '',
      status: election.status || 'active',
    }));
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La consulta tardó demasiado tiempo');
    }
    throw error;
  }
};

const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Error inesperado al cargar los datos';
};
