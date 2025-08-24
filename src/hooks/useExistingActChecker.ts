
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
    if (!actaData.electionId || !actaData.municipio || !actaData.mesaIdentifier) {
      return false;
    }

    try {
      console.log('🔍 Checking for existing act with full identifier check...');
      
      // First get municipality data to build full identifier for comparison
      const { data: mpcaData, error: mpcaError } = await supabase
        .from('mpca')
        .select('idca, idp, idc')
        .eq('idm', parseInt(actaData.municipio))
        .single();

      if (mpcaError || !mpcaData) {
        console.error('❌ Error getting municipality data:', mpcaError);
        return false;
      }

      // Build full identifier: idca-idp-idc-mesa_identifier for comparison
      const expectedFullIdentifier = `${String(mpcaData.idca).padStart(2, '0')}-${String(mpcaData.idp).padStart(2, '0')}-${mpcaData.idc}-${actaData.mesaIdentifier}`;
      console.log('🔍 Expected full identifier:', expectedFullIdentifier);

      // Check for acts using full_identifier for exact match
      const { data, error } = await supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          id,
          mesa_identifier,
          source_type,
          created_at,
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          municipio,
          party_votes (
            votes,
            political_parties (name, siglas, color)
          )
        `)
        .eq('election_id', actaData.electionId)
        .or(`full_identifier.eq.${expectedFullIdentifier},mesa_identifier.eq.${actaData.mesaIdentifier}`);

      if (error) {
        console.error('❌ Error checking existing act:', error);
        return false;
      }

      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} existing acts`);
        const transformedAct: ExistingAct = {
          ...data[0],
          municipality: { name: data[0].municipio || '' },
          party_votes: (data[0].party_votes || []).map(pv => ({
            votes: pv.votes,
            political_parties: {
              name: pv.political_parties?.name || '',
              siglas: pv.political_parties?.siglas || '',
              color: pv.political_parties?.color || '#6B7280'
            }
          }))
        };
        setExistingAct(transformedAct);
        setShowExistingActDialog(true);
        return true;
      }
      
      console.log('ℹ️ No existing acts found');
      return false;
    } catch (error) {
      console.error('💥 Fatal error checking existing act:', error);
      return false;
    }
  };

  const navigateToResults = (selectedMpcaRecord: MpcaData | null, actaData: ActaData) => {
    // Parse mesa identifier to extract individual components for URL
    const mesaParts = actaData.mesaIdentifier.split('-');
    const params = new URLSearchParams({
      municipality: selectedMpcaRecord?.municipio || '',
      district: mesaParts[0] || '',
      section: mesaParts[1] || '',
      table: mesaParts[2] || ''
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
