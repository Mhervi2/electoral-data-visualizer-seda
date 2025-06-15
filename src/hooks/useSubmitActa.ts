
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ActaData, ExistingAct, MpcaData } from '@/types/acta';

export const useSubmitActa = () => {
  const navigate = useNavigate();
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

  const navigateToResults = () => {
    // Build query parameters for the results page to show the specific act
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
    if (!validateData()) return;

    const hasExisting = await checkExistingAct();
    if (hasExisting) {
      // Instead of just showing dialog, navigate to results
      navigateToResults();
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit without requiring authentication
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
          submitted_by: null // No user authentication required
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

      // Navigate to results page to show the submitted act
      navigateToResults();

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
    submitActa,
    navigateToResults
  };
};
