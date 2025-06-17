
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExistingAct, ActaData, MpcaData } from '@/types/acta';

export const useExistingActChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [existingAct, setExistingAct] = useState<ExistingAct | null>(null);
  const [showExistingActDialog, setShowExistingActDialog] = useState(false);

  const checkExistingAct = async (actaData: ActaData): Promise<boolean> => {
    if (!actaData.electionId || !actaData.municipio || !actaData.distrito || !actaData.seccion || !actaData.mesa) {
      return false;
    }

    try {
      console.log('Checking for existing act...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          id,
          district,
          section,
          table_letter,
          source_type,
          created_at,
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          municipio,
          party_votes (
            votes,
            political_parties (name, siglas)
          )
        `)
        .eq('election_id', actaData.electionId)
        .eq('municipality_idm', parseInt(actaData.municipio))
        .eq('district', actaData.distrito)
        .eq('section', actaData.seccion)
        .eq('table_letter', actaData.mesa);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error checking existing act:', error);
        return false;
      }

      if (data && data.length > 0) {
        console.log('Found existing acts:', data.length);
        const transformedAct = {
          ...data[0],
          municipality: { name: data[0].municipio }
        };
        setExistingAct(transformedAct);
        setShowExistingActDialog(true);
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Timeout checking existing act');
        toast({
          variant: "destructive",
          title: "Timeout",
          description: "La verificación tardó demasiado tiempo.",
        });
      } else {
        console.error('Error checking existing act:', error);
      }
      return false;
    }
  };

  const navigateToResults = (selectedMpcaRecord: MpcaData | null, actaData: ActaData) => {
    const params = new URLSearchParams({
      municipality: selectedMpcaRecord?.municipio || '',
      district: actaData.distrito,
      section: actaData.seccion,
      table: actaData.mesa
    });
    
    toast({
      title: "Acta existente encontrada",
      description: "Te hemos llevado a la página de resultados donde puedes ver el acta existente.",
    });

    navigate(`/results?${params.toString()}`);
  };

  return {
    existingAct,
    showExistingActDialog,
    setShowExistingActDialog,
    checkExistingAct,
    navigateToResults
  };
};
