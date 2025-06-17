
import { useActaFormState } from './useActaFormState';
import { useExistingActChecker } from './useExistingActChecker';
import { useActaSubmission } from './useActaSubmission';
import { validateActaData } from '@/utils/actaValidation';
import { useToast } from '@/hooks/use-toast';

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

  const handleCheckExistingAct = async () => {
    return await checkExistingAct(actaData);
  };

  const handleNavigateToResults = () => {
    navigateToResults(selectedMpcaRecord, actaData);
  };

  const submitActa = async () => {
    const validation = validateActaData(actaData);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: validation.message,
      });
      return;
    }

    const hasExisting = await checkExistingAct(actaData);
    if (hasExisting) {
      // Instead of just showing dialog, navigate to results
      navigateToResults(selectedMpcaRecord, actaData);
      return;
    }

    const success = await submitActaToDatabase(actaData);
    if (success) {
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
    navigateToResults: handleNavigateToResults
  };
};
