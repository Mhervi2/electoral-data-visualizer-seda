import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MunicipalityResolution } from './useMunicipalityResolution';

interface BatchProcessingResult {
  success: boolean;
  processedMesas: number;
  createdMesas: number;
  updatedMesas: number;
  createdParties: number;
  totalRows: number;
  errors: string[];
  hasMoreErrors: boolean;
  unresolvedMunicipalities?: any[];
  unresolvedParties?: any[];
  pausedForResolution?: boolean;
  batchComplete?: boolean;
  currentBatch?: number;
  totalBatches?: number;
  nextBatchStart?: number;
  progressPercentage?: number;
}

interface BatchProgress {
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  progressPercentage: number;
  processedMesas: number;
  totalMesas: number;
  errors: string[];
  result?: BatchProcessingResult;
}

export const useBatchProcessing = () => {
  const { toast } = useToast();
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    isProcessing: false,
    currentBatch: 0,
    totalBatches: 0,
    progressPercentage: 0,
    processedMesas: 0,
    totalMesas: 0,
    errors: []
  });

  const processBatch = async (
    file: File,
    electionId: string,
    sourceType: string,
    batchStart: number = 0,
    batchSize: number = 100,
    municipalityResolutions?: MunicipalityResolution[],
    partyResolutions?: any[]
  ): Promise<BatchProcessingResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('electionId', electionId);
    formData.append('sourceType', sourceType === 'real-data' ? 'user' : sourceType);
    formData.append('batchStart', batchStart.toString());
    formData.append('batchSize', batchSize.toString());
    formData.append('batchMode', 'true');

    if (municipalityResolutions && municipalityResolutions.length > 0) {
      const resolutionData = municipalityResolutions.map(resolution => ({
        originalName: resolution.originalName,
        resolvedIdm: typeof resolution.resolution === 'object' ? resolution.resolution.idm : 0
      }));
      formData.append('resolutions', JSON.stringify(resolutionData));
    }

    if (partyResolutions && partyResolutions.length > 0) {
      const partyResolutionData = partyResolutions.map(resolution => ({
        originalName: resolution.originalName,
        resolvedPartyId: typeof resolution.resolution === 'object' ? resolution.resolution.id : resolution.resolution
      }));
      formData.append('partyResolutions', JSON.stringify(partyResolutionData));
    }

    const { data, error } = await supabase.functions.invoke('process-real-data-excel', {
      body: formData,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as BatchProcessingResult;
  };

  const processFileInBatches = useCallback(async (
    file: File,
    electionId: string,
    sourceType: string,
    municipalityResolutions?: MunicipalityResolution[],
    partyResolutions?: any[],
    batchSize: number = 100
  ): Promise<BatchProcessingResult> => {
    let currentBatchStart = 0;
    let totalProcessedMesas = 0;
    let totalCreatedMesas = 0;
    let totalUpdatedMesas = 0;
    let totalCreatedParties = 0;
    let allErrors: string[] = [];
    let totalBatches = 0;
    let totalRows = 0;

    setBatchProgress({
      isProcessing: true,
      currentBatch: 0,
      totalBatches: 0,
      progressPercentage: 0,
      processedMesas: 0,
      totalMesas: 0,
      errors: []
    });

    try {
      // First batch to get total information
      console.log('Starting batch processing...');
      const firstBatch = await processBatch(file, electionId, sourceType, 0, batchSize, municipalityResolutions, partyResolutions);
      
      // Handle unresolved parties or municipalities in first batch
      if (firstBatch.pausedForResolution && (firstBatch.unresolvedParties || firstBatch.unresolvedMunicipalities)) {
        setBatchProgress(prev => ({ ...prev, isProcessing: false }));
        return firstBatch; // Return to show resolution dialog
      }

      totalBatches = firstBatch.totalBatches || 1;
      totalRows = firstBatch.totalRows;
      
      // Update progress with initial batch results
      totalProcessedMesas += firstBatch.processedMesas;
      totalCreatedMesas += firstBatch.createdMesas;
      totalUpdatedMesas += firstBatch.updatedMesas;
      totalCreatedParties += firstBatch.createdParties;
      allErrors = [...allErrors, ...firstBatch.errors];

      setBatchProgress({
        isProcessing: true,
        currentBatch: firstBatch.currentBatch || 1,
        totalBatches,
        progressPercentage: firstBatch.progressPercentage || 0,
        processedMesas: totalProcessedMesas,
        totalMesas: totalRows,
        errors: allErrors
      });

      console.log(`Batch 1/${totalBatches} completed. Processed: ${firstBatch.processedMesas} mesas`);

      // If batch is complete (only one batch needed), return result
      if (firstBatch.batchComplete) {
        const finalResult = {
          ...firstBatch,
          processedMesas: totalProcessedMesas,
          createdMesas: totalCreatedMesas,
          updatedMesas: totalUpdatedMesas,
          createdParties: totalCreatedParties,
          errors: allErrors,
          progressPercentage: 100
        };
        
        setBatchProgress(prev => ({ 
          ...prev, 
          isProcessing: false,
          progressPercentage: 100,
          result: finalResult
        }));
        
        return finalResult;
      }

      // Process remaining batches
      currentBatchStart = firstBatch.nextBatchStart || batchSize;

      while (currentBatchStart < totalRows) {
        console.log(`Processing batch starting at row ${currentBatchStart + 1}...`);
        
        const batchResult = await processBatch(file, electionId, sourceType, currentBatchStart, batchSize, municipalityResolutions, partyResolutions);
        
        // Accumulate results
        totalProcessedMesas += batchResult.processedMesas;
        totalCreatedMesas += batchResult.createdMesas;
        totalUpdatedMesas += batchResult.updatedMesas;
        totalCreatedParties += batchResult.createdParties;
        allErrors = [...allErrors, ...batchResult.errors];

        // Update progress
        setBatchProgress({
          isProcessing: true,
          currentBatch: batchResult.currentBatch || 1,
          totalBatches,
          progressPercentage: batchResult.progressPercentage || 0,
          processedMesas: totalProcessedMesas,
          totalMesas: totalRows,
          errors: allErrors
        });

        console.log(`Batch ${batchResult.currentBatch}/${totalBatches} completed. Total processed: ${totalProcessedMesas} mesas`);

        // Check if this was the last batch
        if (batchResult.batchComplete) {
          break;
        }

        currentBatchStart = batchResult.nextBatchStart || (currentBatchStart + batchSize);
      }

      // Final result
      const finalResult: BatchProcessingResult = {
        success: allErrors.length === 0,
        processedMesas: totalProcessedMesas,
        createdMesas: totalCreatedMesas,
        updatedMesas: totalUpdatedMesas,
        createdParties: totalCreatedParties,
        totalRows,
        errors: allErrors,
        hasMoreErrors: false,
        batchComplete: true,
        progressPercentage: 100
      };

      setBatchProgress(prev => ({ 
        ...prev, 
        isProcessing: false,
        progressPercentage: 100,
        result: finalResult
      }));

      console.log(`✅ All batches completed! Total: ${totalProcessedMesas} mesas processed`);

      return finalResult;

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      setBatchProgress(prev => ({ ...prev, isProcessing: false }));
      
      toast({
        variant: "destructive",
        title: "Error en el procesamiento por lotes",
        description: error instanceof Error ? error.message : "Error desconocido",
      });

      throw error;
    }
  }, [toast]);

  const resetProgress = useCallback(() => {
    setBatchProgress({
      isProcessing: false,
      currentBatch: 0,
      totalBatches: 0,
      progressPercentage: 0,
      processedMesas: 0,
      totalMesas: 0,
      errors: []
    });
  }, []);

  return {
    batchProgress,
    processFileInBatches,
    resetProgress
  };
};