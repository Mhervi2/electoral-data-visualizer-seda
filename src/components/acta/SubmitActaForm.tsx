
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureFileUpload } from '@/hooks/useSecureFileUpload';
import { useActaData } from '@/hooks/useActaData';
import { useSubmitActa } from '@/hooks/useSubmitActa';
import { useBulkImageUpload } from '@/hooks/useBulkImageUpload';
import { validateImageOnlyActa } from '@/utils/imageOnlyValidation';
import { useActaFormState } from '@/hooks/useActaFormState';
import { ElectionSelection } from './ElectionSelection';
import { MesaIdentification } from './MesaIdentification';
import { ImageUploadSection } from './ImageUploadSection';
import { MultiImageUpload } from './MultiImageUpload';
import { ResultsData } from './ResultsData';
import { PartyVotes } from './PartyVotes';
import { MailVotersSection } from './MailVotersSection';
import { ExistingActDialog } from './ExistingActDialog';
import { ValidationWarningDialog } from '@/components/ui/validation-warning-dialog';
import { MunicipalitySelector } from './MunicipalitySelector';
import { useSystemConfig } from '@/contexts/SystemConfigContext';

export const SubmitActaForm = () => {
  const { isMailVotingEnabled } = useSystemConfig();
  const [activeTab, setActiveTab] = useState('complete');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageOnlyElectionId, setImageOnlyElectionId] = useState('');
  
  // State for image-only municipality selection
  const { 
    selectedMpcaRecord: imageOnlyMpcaRecord, 
    handleMunicipalityChange: handleImageOnlyMunicipalityChange 
  } = useActaFormState();
  
  const { uploadFile, uploading } = useSecureFileUpload();
  const { politicalParties, elections } = useActaData();
  const { isSubmitting: bulkSubmitting, submitImageOnlyActs } = useBulkImageUpload();
  const {
    actaData,
    existingAct,
    showExistingActDialog,
    selectedMpcaRecord,
    isSubmitting,
    showWarningDialog,
    validationWarnings,
    setShowExistingActDialog,
    handleMunicipalityChange,
    handleInputChange,
    handleVoteChange,
    handleMailVotersChange,
    checkExistingAct,
    submitActa,
    navigateToResults,
    handleWarningDialogContinue,
    handleWarningDialogCancel
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

  const handleImageOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateImageOnlyActa(imageOnlyElectionId, selectedImages, imageOnlyMpcaRecord);
    if (!validation.isValid) {
      // Validation error will be shown by the useBulkImageUpload hook
      return;
    }

    const success = await submitImageOnlyActs(imageOnlyElectionId, selectedImages, imageOnlyMpcaRecord);
    if (success) {
      // Reset form
      setSelectedImages([]);
      setImageOnlyElectionId('');
      handleImageOnlyMunicipalityChange('', null);
    }
  };

  return (
    <>
      <ExistingActDialog 
        open={showExistingActDialog}
        onOpenChange={setShowExistingActDialog}
        existingAct={existingAct}
        onNavigateToResults={navigateToResults}
      />

      <ValidationWarningDialog
        open={showWarningDialog}
        onOpenChange={() => {}}
        warnings={validationWarnings}
        onContinue={handleWarningDialogContinue}
        onCancel={handleWarningDialogCancel}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="complete">Acta Completa</TabsTrigger>
          <TabsTrigger value="image-only">Solo Imágenes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="complete" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Three-column layout for desktop, single column for mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ElectionSelection 
                elections={elections}
                selectedElectionId={actaData.electionId}
                onElectionChange={(value) => handleInputChange('electionId', value)}
                autoSelectActive={true}
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
            </div>

            <ResultsData
              censo={actaData.censo}
              votantes={actaData.votantes}
              blancos={actaData.blancos}
              nulos={actaData.nulos}
              observations={actaData.observations}
              onInputChange={handleInputChange}
            />

            <PartyVotes 
              politicalParties={politicalParties}
              votos={actaData.votos}
              onVoteChange={handleVoteChange}
              provincia={selectedMpcaRecord?.provincia}
            />

            {isMailVotingEnabled() && (
              <MailVotersSection 
                mailVoters={actaData.mailVoters}
                onMailVotersChange={handleMailVotersChange}
              />
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Enviando...' : 'Enviar Acta Electoral'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="image-only" className="mt-6">
          <form onSubmit={handleImageOnlySubmit} className="space-y-6">
            <ElectionSelection 
              elections={elections}
              selectedElectionId={imageOnlyElectionId}
              onElectionChange={setImageOnlyElectionId}
              autoSelectActive={true}
            />

            <MunicipalitySelector 
              selectedMunicipalityId={imageOnlyMpcaRecord?.idm.toString() || ''}
              onMunicipalitySelect={handleImageOnlyMunicipalityChange}
            />

            <MultiImageUpload 
              onImagesChange={setSelectedImages}
              uploading={bulkSubmitting}
              maxImages={5}
            />

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Al subir solo imágenes, se crearán actas con datos básicos que deberán ser completados posteriormente en la sección de <strong>Gestión de Actas</strong>.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={bulkSubmitting}>
              {bulkSubmitting ? 'Subiendo imágenes...' : `Subir ${selectedImages.length} imagen${selectedImages.length !== 1 ? 'es' : ''}`}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
};
