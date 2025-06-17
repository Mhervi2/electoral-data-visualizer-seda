
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSecureFileUpload } from '@/hooks/useSecureFileUpload';
import { useOptimizedActaData } from '@/hooks/useOptimizedActaData';
import { useSubmitActa } from '@/hooks/useSubmitActa';
import { ElectionSelection } from './ElectionSelection';
import { MesaIdentification } from './MesaIdentification';
import { ImageUploadSection } from './ImageUploadSection';
import { ResultsData } from './ResultsData';
import { PartyVotes } from './PartyVotes';
import { ExistingActDialog } from './ExistingActDialog';

export const SubmitActaForm = () => {
  const { uploadFile, uploading } = useSecureFileUpload();
  const { 
    mpcaData, 
    politicalParties, 
    elections, 
    loading: actaDataLoading, 
    error: actaDataError,
    refetch: refetchActaData
  } = useOptimizedActaData();
  
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
      
      const imageUrl = await uploadFile(file, 'electoral-acts', {
        maxSizeInMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        folder: 'acts',
        requireAuth: false
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

  if (actaDataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (actaDataError) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium">Error al cargar los datos</h3>
        <p className="text-red-600 text-sm mt-1">{actaDataError}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetchActaData}
          className="mt-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

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
          mpcaData={mpcaData}
          mpcaLoading={actaDataLoading}
          mpcaError={actaDataError}
          selectedMpcaRecord={selectedMpcaRecord}
          municipio={actaData.municipio}
          distrito={actaData.distrito}
          seccion={actaData.seccion}
          mesa={actaData.mesa}
          onMunicipalityChange={handleMunicipalityChange}
          onInputChange={handleInputChange}
          onBlur={checkExistingAct}
          onRetryMpca={refetchActaData}
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
