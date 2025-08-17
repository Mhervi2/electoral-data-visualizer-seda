
import { useState } from 'react';
import { useActaFormState } from './useActaFormState';
import { useExistingActChecker } from './useExistingActChecker';
import { useActaSubmission } from './useActaSubmission';
import { validateActaData, validateActaDataWithWarnings } from '@/utils/actaValidation';
import { useToast } from '@/hooks/use-toast';

export const useSubmitActa = () => {
  const { toast } = useToast();
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const {
    actaData,
    selectedMpcaRecord,
    handleMunicipalityChange,
    handleInputChange,
    handleVoteChange,
    handleMailVotersChange,
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
    const validation = validateActaDataWithWarnings(actaData);
    
    // Check for critical errors first
    if (validation.hasErrors) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: validation.errors.join(' '),
      });
      return;
    }

    // If there are warnings, show confirmation dialog
    if (validation.hasWarnings) {
      setValidationWarnings(validation.warnings);
      setShowWarningDialog(true);
      return;
    }

    // No errors or warnings, proceed normally
    await submitActaInternal();
  };

  const submitActaInternal = async () => {
    const hasExisting = await checkExistingAct(actaData);
    if (hasExisting) {
      // Instead of just showing dialog, navigate to results
      navigateToResults(selectedMpcaRecord, actaData);
      return;
    }

    const success = await submitActaToDatabase(actaData, selectedMpcaRecord);
    if (success) {
      resetForm();
      navigateToResults(selectedMpcaRecord, actaData);
    }
  };

  const handleWarningDialogContinue = async () => {
    setShowWarningDialog(false);
    await submitActaInternal();
  };

  const handleWarningDialogCancel = () => {
    setShowWarningDialog(false);
  };

  return {
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
    checkExistingAct: handleCheckExistingAct,
    submitActa,
    navigateToResults: handleNavigateToResults,
    handleWarningDialogContinue,
    handleWarningDialogCancel
  };
};
