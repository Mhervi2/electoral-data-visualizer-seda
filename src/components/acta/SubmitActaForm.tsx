
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSecureFileUpload } from '@/hooks/useSecureFileUpload';
import { useActaData } from '@/hooks/useActaData';
import { useSubmitActa } from '@/hooks/useSubmitActa';
import { ElectionSelection } from './ElectionSelection';
import { MesaIdentification } from './MesaIdentification';
import { ImageUploadSection } from './ImageUploadSection';
import { ResultsData } from './ResultsData';
import { PartyVotes } from './PartyVotes';
import { ExistingActDialog } from './ExistingActDialog';

export const SubmitActaForm = () => {
  const { uploadFile, uploading } = useSecureFileUpload();
  const { politicalParties, elections } = useActaData();
  const {
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
  } = useSubmitActa();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      
      // Allow image upload without authentication
      const imageUrl = await uploadFile(file, 'electoral-acts', {
        maxSizeInMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'acts',
        requireAuth: false // This allows uploads without login
      });

      if (imageUrl) {
        handleInputChange('imagen' as any, file as any);
        handleInputChange('imageUrl' as any, imageUrl);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitActa();
  };

  return (
    <>
      <ExistingActDialog 
        open={showExistingActDialog}
        onOpenChange={setShowExistingActDialog}
        existingAct={existingAct}
        onNavigateToResults={navigateToResults}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ElectionSelection 
          elections={elections}
          selectedElectionId={actaData.electionId}
          onElectionChange={(value) => handleInputChange('electionId', value)}
        />

        <MesaIdentification 
          selectedMpcaRecord={selectedMpcaRecord}
          municipio={actaData.municipio}
          mesaIdentifier={actaData.mesaIdentifier}
          onMunicipalityChange={handleMunicipalityChange}
          onInputChange={handleInputChange}
          onBlur={checkExistingAct}
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
    </>
  );
};
