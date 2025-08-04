import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TerritorialSummary {
  name: string;
  id: number;
  count: number;
}

export interface TerritorialData {
  autonomousCommunities: TerritorialSummary[];
  provinces: TerritorialSummary[];
  totalMunicipalities: number;
  conflicts: string[];
  loading: boolean;
}

export const useTerritorialManagement = () => {
  console.log('🔍 useTerritorialManagement hook started');
  
  const { toast } = useToast();
  const [data, setData] = useState<TerritorialData>({
    autonomousCommunities: [],
    provinces: [],
    totalMunicipalities: 0,
    conflicts: [],
    loading: true
  });
  
  console.log('🔍 Hook state initialized:', data);

  const fetchTerritorialSummary = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // Get unique autonomous communities with counts
      const { data: caData, error: caError } = await supabase
        .from('mpca')
        .select('ca, idca')
        .not('ca', 'is', null)
        .not('ca', 'eq', '')
        .limit(10000);

      if (caError) throw caError;

      // Get unique provinces with counts
      const { data: provData, error: provError } = await supabase
        .from('mpca')
        .select('provincia, idp')
        .not('provincia', 'is', null)
        .not('provincia', 'eq', '')
        .limit(10000);

      if (provError) throw provError;

      // Get total municipalities count
      const { count: totalMunicipalities, error: countError } = await supabase
        .from('mpca')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      console.log('🔍 Raw CA data:', caData?.length, 'records');
      console.log('🔍 Raw Province data:', provData?.length, 'records');

      // Process autonomous communities
      const caMap = new Map<string, { id: number; count: number }>();
      caData.forEach(item => {
        const name = item.ca?.trim();
        if (!name) return;
        
        if (!caMap.has(name)) {
          caMap.set(name, { id: item.idca, count: 0 });
        }
        caMap.get(name)!.count++;
      });

      const autonomousCommunities = Array.from(caMap.entries())
        .map(([name, data]) => ({ name, id: data.id, count: data.count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('🔍 Processed CA:', autonomousCommunities.length, 'unique communities');

      // Process provinces
      const provMap = new Map<string, { id: number; count: number }>();
      provData.forEach(item => {
        const name = item.provincia?.trim();
        if (!name) return;
        
        if (!provMap.has(name)) {
          provMap.set(name, { id: item.idp, count: 0 });
        }
        provMap.get(name)!.count++;
      });

      const provinces = Array.from(provMap.entries())
        .map(([name, data]) => ({ name, id: data.id, count: data.count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('🔍 Processed Provinces:', provinces.length, 'unique provinces');

      // Detect conflicts
      const conflicts = [];
      
      // Check for IDCA conflicts
      const idcaGroups = new Map<number, Set<string>>();
      caData.forEach(item => {
        if (!idcaGroups.has(item.idca)) {
          idcaGroups.set(item.idca, new Set());
        }
        idcaGroups.get(item.idca)!.add(item.ca?.trim() || '');
      });

      idcaGroups.forEach((names, idca) => {
        const validNames = Array.from(names).filter(name => name && name !== '');
        if (validNames.length > 1) {
          conflicts.push(`IDCA ${idca}: ${validNames.join(', ')}`);
        }
      });

      // Check for IDP conflicts
      const idpGroups = new Map<number, Set<string>>();
      provData.forEach(item => {
        if (!idpGroups.has(item.idp)) {
          idpGroups.set(item.idp, new Set());
        }
        idpGroups.get(item.idp)!.add(item.provincia?.trim() || '');
      });

      idpGroups.forEach((names, idp) => {
        const validNames = Array.from(names).filter(name => name && name !== '');
        if (validNames.length > 1) {
          conflicts.push(`IDP ${idp}: ${validNames.join(', ')}`);
        }
      });

      console.log('🔍 Final data:', {
        autonomousCommunities: autonomousCommunities.length,
        provinces: provinces.length,
        conflicts: conflicts.length
      });

      setData({
        autonomousCommunities,
        provinces,
        totalMunicipalities: totalMunicipalities || 0,
        conflicts,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching territorial summary:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos territoriales.",
      });
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const updateTerritorialCodes = async (
    type: 'ca' | 'provincia',
    name: string,
    newId: number
  ): Promise<number> => {
    try {
      const field = type === 'ca' ? 'idca' : 'idp';
      const nameField = type === 'ca' ? 'ca' : 'provincia';

      const { data: affectedRecords, error: queryError } = await supabase
        .from('mpca')
        .select('idm')
        .eq(nameField, name);

      if (queryError) throw queryError;

      const { error: updateError } = await supabase
        .from('mpca')
        .update({ [field]: newId })
        .eq(nameField, name);

      if (updateError) throw updateError;

      const affectedCount = affectedRecords?.length || 0;

      toast({
        title: "Éxito",
        description: `${affectedCount} municipios actualizados correctamente.`,
      });

      // Refresh data
      await fetchTerritorialSummary();

      return affectedCount;
    } catch (error) {
      console.error('Error updating territorial codes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los códigos territoriales.",
      });
      throw error;
    }
  };

  const updateTerritorialName = async (
    type: 'ca' | 'provincia',
    oldName: string,
    newName: string
  ): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('update_territorial_name', {
        p_type: type,
        p_old_name: oldName,
        p_new_name: newName
      });

      if (error) throw error;

      const affectedCount = data || 0;

      toast({
        title: "Éxito",
        description: `Nombre actualizado correctamente. ${affectedCount} municipios afectados.`,
      });

      // Refresh data
      await fetchTerritorialSummary();

      return affectedCount;
    } catch (error) {
      console.error('Error updating territorial name:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el nombre territorial.",
      });
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered in useTerritorialManagement');
    fetchTerritorialSummary();
  }, []);

  console.log('🔍 Returning data from hook:', data);

  return {
    ...data,
    updateTerritorialCodes,
    updateTerritorialName,
    refetch: fetchTerritorialSummary
  };
};