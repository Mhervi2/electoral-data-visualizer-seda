
import { useActaFormState } from './useActaFormState';
import { useExistingActChecker } from './useExistingActChecker';
import { useActaSubmission } from './useActaSubmission';
import { validateActaData } from '@/utils/actaValidation';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedActaData } from './useOptimizedActaData';

export const useSubmitActa = () => {
  const { toast } = useToast();
  const {
    actaData,
    selectedMpcaRecord,
    handleMunicipalityChange,
    handleInputChange,
    handleVoteChange,
    resetForm
  } = useActaFormState();

  const {
    existingAct,
    showExistingActDialog,
    setShowExistingActDialog,
    checkExistingAct,
    navigateToResults
  } = useExistingActChecker();

  const { isSubmitting, submitActa: submitActaToDatabase } = useActaSubmission();

  // Get optimized data instead of relying on separate hooks
  const optimizedData = useOptimizedActaData();

  const handleCheckExistingAct = async () => {
    console.log('Checking for existing act with data:', {
      electionId: actaData.electionId,
      municipio: actaData.municipio,
      distrito: actaData.distrito,
      seccion: actaData.seccion,
      mesa: actaData.mesa
    });
    
    return await checkExistingAct(actaData);
  };

  const handleNavigateToResults = () => {
    console.log('Navigating to results with:', {
      selectedMpcaRecord,
      actaData: {
        municipio: actaData.municipio,
        distrito: actaData.distrito,
        seccion: actaData.seccion,
        mesa: actaData.mesa
      }
    });
    navigateToResults(selectedMpcaRecord, actaData);
  };

  const submitActa = async () => {
    console.log('Starting acta submission with data:', actaData);
    
    const validation = validateActaData(actaData);
    if (!validation.isValid) {
      console.error('Validation failed:', validation.message);
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: validation.message,
      });
      return;
    }

    console.log('Validation passed, checking for existing act...');
    const hasExisting = await checkExistingAct(actaData);
    if (hasExisting) {
      console.log('Existing act found, navigating to results...');
      navigateToResults(selectedMpcaRecord, actaData);
      return;
    }

    console.log('No existing act found, submitting new act...');
    const success = await submitActaToDatabase(actaData);
    if (success) {
      console.log('Act submitted successfully, resetting form and navigating...');
      resetForm();
      navigateToResults(selectedMpcaRecord, actaData);
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
    checkExistingAct: handleCheckExistingAct,
    submitActa,
    navigateToResults: handleNavigateToResults,
    // Include optimized data for better integration
    ...optimizedData
  };
};
