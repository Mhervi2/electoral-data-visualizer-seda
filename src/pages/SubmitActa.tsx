import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useSecureFileUpload } from '@/hooks/useSecureFileUpload';
import { useActaData } from '@/hooks/useActaData';
import { ElectionSelection } from '@/components/acta/ElectionSelection';
import { MesaIdentification } from '@/components/acta/MesaIdentification';
import { ImageUploadSection } from '@/components/acta/ImageUploadSection';
import { ResultsData } from '@/components/acta/ResultsData';
import { PartyVotes } from '@/components/acta/PartyVotes';
import { ExistingActDialog } from '@/components/acta/ExistingActDialog';
import { ActaData, ExistingAct, MpcaData } from '@/types/acta';

const SubmitActa = () => {
  const { user } = useAuth();
  const { uploadFile, uploading } = useSecureFileUpload();
  const { mpcaData, politicalParties, elections, loading } = useActaData();
  const [existingAct, setExistingAct] = useState<ExistingAct | null>(null);
  const [showExistingActDialog, setShowExistingActDialog] = useState(false);
  const [selectedMpcaRecord, setSelectedMpcaRecord] = useState<MpcaData | null>(null);
  
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleMunicipalityChange = (municipalityId: string) => {
    const selectedMpca = mpcaData.find(m => m.idm.toString() === municipalityId);
    setSelectedMpcaRecord(selectedMpca || null);
    setActaData(prev => ({ ...prev, municipio: municipalityId }));
  };

  const checkExistingAct = async () => {
    if (!actaData.electionId || !actaData.municipio || !actaData.distrito || !actaData.seccion || !actaData.mesa) {
      return;
    }

    try {
      console.log('Checking for existing act...');
      const { data, error } = await supabase
        .from('electoral_acts')
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
          municipality:municipalities (name),
          party_votes (
            votes,
            political_parties (name, siglas)
          )
        `)
        .eq('election_id', actaData.electionId)
        .eq('municipality_id', actaData.municipio)
        .eq('district', actaData.distrito)
        .eq('section', actaData.seccion)
        .eq('table_letter', actaData.mesa);

      if (data && data.length > 0) {
        console.log('Found existing acts:', data.length);
        setExistingAct(data[0]);
        setShowExistingActDialog(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking existing act:', error);
      return false;
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      
      const imageUrl = await uploadFile(file, 'electoral-acts', {
        maxSizeInMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'acts'
      });

      if (imageUrl) {
        setActaData(prev => ({ ...prev, imagen: file, imageUrl }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user)  {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para enviar un acta.",
      });
      return;
    }

    if (!validateData()) return;

    // Check for existing act
    const hasExisting = await checkExistingAct();
    if (hasExisting) return;

    setIsSubmitting(true);
    
    try {
      // Get the current user's auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo verificar la sesión del usuario.",
        });
        return;
      }

      // Insert electoral act with image URL if available
      const { data: actData, error: actError } = await supabase
        .from('electoral_acts')
        .insert({
          election_id: actaData.electionId,
          municipality_id: actaData.municipio,
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

      // Insert party votes
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

      // Log audit action
      await supabase.rpc('log_audit_action', {
        p_action: 'CREATE_ELECTORAL_ACT',
        p_table_name: 'electoral_acts',
        p_record_id: actData.id,
        p_new_values: {
          municipality_id: actaData.municipio,
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
        Enviar Acta Electoral
      </h1>

      <ExistingActDialog 
        open={showExistingActDialog}
        onOpenChange={setShowExistingActDialog}
        existingAct={existingAct}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ElectionSelection 
          elections={elections}
          selectedElectionId={actaData.electionId}
          onElectionChange={(value) => handleInputChange('electionId', value)}
        />

        <MesaIdentification 
          mpcaData={mpcaData}
          selectedMpcaRecord={selectedMpcaRecord}
          municipio={actaData.municipio}
          distrito={actaData.distrito}
          seccion={actaData.seccion}
          mesa={actaData.mesa}
          onMunicipalityChange={handleMunicipalityChange}
          onInputChange={handleInputChange}
          onBlur={checkExistingAct}
          loading={loading}
        />

        <ImageUploadSection 
          imagen={actaData.imagen}
          imageUrl={actaData.imageUrl}
          uploading={uploading}
          onImageUpload={handleImageUpload}
        />

        <ResultsData 
          censo={actaData.censo}
          votantes={actaData.votantes}
          blancos={actaData.blancos}
          nulos={actaData.nulos}
          onInputChange={handleInputChange}
        />

        <PartyVotes 
          politicalParties={politicalParties}
          votos={actaData.votos}
          onVoteChange={handleVoteChange}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
          {isSubmitting ? 'Enviando...' : 'Enviar Acta Electoral'}
        </Button>
      </form>
    </div>
  );
};

export default SubmitActa;
