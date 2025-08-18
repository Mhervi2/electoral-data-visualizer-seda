import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComunidadAutonoma {
  idca: number;
  ca: string;
  total_municipios: number;
}

export interface Provincia {
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
  total_municipios: number;
}

export const useGeographicalHierarchy = () => {
  const [comunidades, setComunidades] = useState<ComunidadAutonoma[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [loadingComunidades, setLoadingComunidades] = useState(false);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load autonomous communities on mount
  useEffect(() => {
    const loadComunidades = async () => {
      setLoadingComunidades(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('comunidades_autonomas')
          .select('*')
          .order('ca');

        if (queryError) {
          console.error('Error loading comunidades:', queryError);
          setError('Error al cargar las comunidades autónomas');
          return;
        }

        setComunidades(data || []);
      } catch (err) {
        console.error('Error loading comunidades:', err);
        setError('Error al cargar las comunidades autónomas');
      } finally {
        setLoadingComunidades(false);
      }
    };

    loadComunidades();
  }, []);

  const loadProvinciasByCA = async (idca: number) => {
    setLoadingProvincias(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('provincias_by_ca')
        .select('*')
        .eq('idca', idca)
        .order('provincia');

      if (queryError) {
        console.error('Error loading provincias:', queryError);
        setError('Error al cargar las provincias');
        return [];
      }

      setProvincias(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading provincias:', err);
      setError('Error al cargar las provincias');
      return [];
    } finally {
      setLoadingProvincias(false);
    }
  };

  return {
    comunidades,
    provincias,
    loadingComunidades,
    loadingProvincias,
    error,
    loadProvinciasByCA,
  };
};