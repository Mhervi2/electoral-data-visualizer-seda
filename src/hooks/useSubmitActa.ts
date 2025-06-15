
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ActaData, ExistingAct, MpcaData } from '@/types/acta';

export const useSubmitActa = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [existingAct, setExistingAct] = useState<ExistingAct | null>(null);
  const [showExistingActDialog, setShowExistingActDialog] = useState(false);
  const [selectedMpcaRecord, setSelectedMpcaRecord] = useState<MpcaData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [actaData, setActaData] = useState<ActaData>({
    electionId: '',
    municipio: '',
    distrito: '',
    seccion: '',
    mesa: '',
    censo: '',
    votantes: '',
    blancos: '',
    nulos: '',
    votos: {},
  });

  const handleMunicipalityChange = (municipalityId: string, municipalityData: MpcaData | null) => {
    console.log('Municipality selected:', municipalityId, municipalityData);
    setSelectedMpcaRecord(municipalityData);
    setActaData(prev => ({ ...prev, municipio: municipalityId }));
  };

  const handleInputChange = (field: keyof ActaData, value: string) => {
    setActaData(prev => ({ ...prev, [field]: value }));
  };

  const handleVoteChange = (partidoId: string, votes: string) => {
    setActaData(prev => ({
      ...prev,
      votos: { ...prev.votos, [partidoId]: votes }
    }));
  };

  const checkExistingAct = async () => {
    if (!actaData.electionId || !actaData.municipio || !actaData.distrito || !actaData.seccion || !actaData.mesa) {
      return;
    }

    try {
      console.log('Checking for existing act...');
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
    } catch (error) {
      console.error('Error checking existing act:', error);
      return false;
    }
  };

  const validateData = (): boolean => {
    const censo = parseInt(actaData.censo) || 0;
    const votantes = parseInt(actaData.votantes) || 0;
    const blancos = parseInt(actaData.blancos) || 0;
    const nulos = parseInt(actaData.nulos) || 0;
    
    const totalVotosCandidaturas = Object.values(actaData.votos)
      .reduce((sum, votes) => sum + (parseInt(votes) || 0), 0);

    if (votantes > censo) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El total de votantes no puede ser mayor que el censo.",
      });
      return false;
    }

    if (totalVotosCandidaturas + blancos + nulos !== votantes) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La suma de votos a candidaturas + blancos + nulos debe igual al total de votantes.",
      });
      return false;
    }

    return true;
  };

  const submitActa = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para enviar un acta.",
      });
      return;
    }

    if (!validateData()) return;

    const hasExisting = await checkExistingAct();
    if (hasExisting) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo verificar la sesión del usuario.",
        });
        return;
      }

      const { data: actData, error: actError } = await supabase
        .from('electoral_acts')
        .insert({
          election_id: actaData.electionId,
          municipality_idm: parseInt(actaData.municipio),
          district: actaData.distrito,
          section: actaData.seccion,
          table_letter: actaData.mesa,
          census_total: parseInt(actaData.censo),
          total_voters: parseInt(actaData.votantes),
          blank_votes: parseInt(actaData.blancos),
          null_votes: parseInt(actaData.nulos),
          source_type: 'user',
          image_url: actaData.imageUrl,
          submitted_by: authUser.id
        })
        .select()
        .single();

      if (actError) throw actError;

      const partyVotesData = Object.entries(actaData.votos)
        .filter(([_, votes]) => votes && parseInt(votes) > 0)
        .map(([partyId, votes]) => ({
          electoral_act_id: actData.id,
          party_id: partyId,
          votes: parseInt(votes)
        }));

      if (partyVotesData.length > 0) {
        const { error: votesError } = await supabase
          .from('party_votes')
          .insert(partyVotesData);

        if (votesError) throw votesError;
      }

      await supabase.rpc('log_audit_action', {
        p_action: 'CREATE_ELECTORAL_ACT',
        p_table_name: 'electoral_acts',
        p_record_id: actData.id,
        p_new_values: {
          municipality_idm: parseInt(actaData.municipio),
          district: actaData.distrito,
          section: actaData.seccion,
          table_letter: actaData.mesa
        }
      });

      toast({
        title: "Acta enviada",
        description: "El acta electoral ha sido enviada correctamente.",
      });

      // Reset form
      setActaData({
        electionId: '',
        municipio: '',
        distrito: '',
        seccion: '',
        mesa: '',
        censo: '',
        votantes: '',
        blancos: '',
        nulos: '',
        votos: {},
      });
      setSelectedMpcaRecord(null);

    } catch (error) {
      console.error('Error submitting act:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el acta. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    actaData,
    existingAct,
    showExistingActDialog,
    selectedMpcaRecord,
    isSubmitting,
    setShowExistingActDialog,
    handleMunicipalityChange,
    handleInputChange,
    handleVoteChange,
    checkExistingAct,
    submitActa
  };
};
