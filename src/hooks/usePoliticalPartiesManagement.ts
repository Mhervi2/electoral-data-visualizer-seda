import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PoliticalPartyData {
  name: string;
  siglas: string;
  color: string;
}

export const usePoliticalPartiesManagement = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const generateId = (siglas: string): string => {
    return siglas.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const validateSiglas = async (siglas: string, excludeId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('political_parties')
      .select('id')
      .eq('siglas', siglas)
      .neq('id', excludeId || '');

    if (error) {
      console.error('Error validating siglas:', error);
      return false;
    }

    return data.length === 0;
  };

  const createParty = async (partyData: PoliticalPartyData): Promise<boolean> => {
    try {
      setIsCreating(true);

      // Validate siglas uniqueness
      const isUnique = await validateSiglas(partyData.siglas);
      if (!isUnique) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Las siglas ya están en uso por otro partido.",
        });
        return false;
      }

      const id = generateId(partyData.siglas);
      
      const { error } = await supabase
        .from('political_parties')
        .insert({
          id,
          name: partyData.name,
          siglas: partyData.siglas,
          color: partyData.color,
        });

      if (error) {
        console.error('Error creating party:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear el partido político.",
        });
        return false;
      }

      toast({
        title: "Éxito",
        description: "Partido político creado correctamente.",
      });
      return true;

    } catch (error) {
      console.error('Fatal error creating party:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al crear el partido.",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateParty = async (id: string, partyData: PoliticalPartyData): Promise<boolean> => {
    try {
      setIsUpdating(true);

      // Validate siglas uniqueness (excluding current party)
      const isUnique = await validateSiglas(partyData.siglas, id);
      if (!isUnique) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Las siglas ya están en uso por otro partido.",
        });
        return false;
      }

      const { error } = await supabase
        .from('political_parties')
        .update({
          name: partyData.name,
          siglas: partyData.siglas,
          color: partyData.color,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating party:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el partido político.",
        });
        return false;
      }

      toast({
        title: "Éxito",
        description: "Partido político actualizado correctamente.",
      });
      return true;

    } catch (error) {
      console.error('Fatal error updating party:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al actualizar el partido.",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteParty = async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('political_parties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting party:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el partido político.",
        });
        return false;
      }

      toast({
        title: "Éxito",
        description: "Partido político eliminado correctamente.",
      });
      return true;

    } catch (error) {
      console.error('Fatal error deleting party:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al eliminar el partido.",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createParty,
    updateParty,
    deleteParty,
    validateSiglas,
    isCreating,
    isUpdating,
    isDeleting,
  };
};