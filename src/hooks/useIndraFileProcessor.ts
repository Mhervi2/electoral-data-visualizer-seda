
import { useState } from 'react';
import { parseExcelData } from '@/utils/indraFileParser';
import { getActiveElection } from '@/services/indraDataService';
import { createElectoralActFromIndraRow, createPartyVotesForAct } from '@/services/electoralActService';

interface ProcessingResult {
  processedRows: number;
  createdActs: number;
  createdVotes: number;
  errors: string[];
}

export const useIndraFileProcessor = () => {
  const [processing, setProcessing] = useState(false);

  const processIndraFile = async (file: File): Promise<ProcessingResult> => {
    setProcessing(true);
    const result: ProcessingResult = {
      processedRows: 0,
      createdActs: 0,
      createdVotes: 0,
      errors: []
    };

    try {
      // Read file content
      const text = await file.text();
      const rows = parseExcelData(text);

      if (rows.length === 0) {
        throw new Error('No data found in file');
      }

      console.log(`Processing ${rows.length} rows from INDRA file`);

      // Get active election
      const election = await getActiveElection();

      // Process each row
      for (const row of rows) {
        try {
          result.processedRows++;

          const { actId } = await createElectoralActFromIndraRow(row, election.id);
          result.createdActs++;

          const { createdVotes } = await createPartyVotesForAct(row, actId);
          result.createdVotes += createdVotes;

        } catch (rowError) {
          console.error('Error processing row:', rowError);
          result.errors.push(`Row ${result.processedRows}: ${rowError}`);
        }
      }

      console.log('Processing completed:', result);
      return result;

    } catch (error) {
      console.error('Error processing INDRA file:', error);
      result.errors.push(`General error: ${error}`);
      return result;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processIndraFile,
    processing
  };
};
