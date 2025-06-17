
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IndraRow {
  codmun: string;
  mesa: string;
  [partyName: string]: string | number;
}

interface ProcessingResult {
  processedRows: number;
  createdActs: number;
  createdVotes: number;
  errors: string[];
}

export const useIndraFileUpload = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const parseExcelData = (csvText: string): IndraRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: IndraRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

      const row: IndraRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }

    return rows;
  };

  const extractMesaInfo = (mesaString: string) => {
    // Format: "01001A" -> district: "01", section: "001", table: "A"
    const match = mesaString.match(/^(\d{2})(\d{3})([A-Z])$/);
    if (!match) {
      throw new Error(`Invalid mesa format: ${mesaString}`);
    }
    
    return {
      district: match[1],
      section: match[2],
      table_letter: match[3]
    };
  };

  const findMunicipalityByCode = async (codmun: string): Promise<any> => {
    const { data, error } = await supabase
      .from('mpca')
      .select('*')
      .eq('idm', parseInt(codmun))
      .single();

    if (error) {
      throw new Error(`Municipality not found for code: ${codmun}`);
    }

    return data;
  };

  const ensurePartyExists = async (partyName: string): Promise<string> => {
    // First, try to find existing party by name or siglas
    const { data: existingParty } = await supabase
      .from('political_parties')
      .select('id')
      .or(`name.ilike.%${partyName}%,siglas.ilike.%${partyName}%`)
      .single();

    if (existingParty) {
      return existingParty.id;
    }

    // Create new party if it doesn't exist
    const partyId = partyName.toLowerCase().replace(/\s+/g, '_');
    const { data: newParty, error } = await supabase
      .from('political_parties')
      .insert({
        id: partyId,
        name: partyName,
        siglas: partyName.length <= 10 ? partyName : partyName.substring(0, 10),
        color: '#6B7280' // Default gray color
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating party:', error);
      throw new Error(`Failed to create party: ${partyName}`);
    }

    return newParty.id;
  };

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
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('id')
        .eq('status', 'active')
        .single();

      if (electionError || !election) {
        throw new Error('No active election found');
      }

      // Process each row
      for (const row of rows) {
        try {
          result.processedRows++;

          // Extract municipality and mesa info
          const municipality = await findMunicipalityByCode(row.codmun as string);
          const mesaInfo = extractMesaInfo(row.mesa as string);

          // Create electoral act
          const { data: electoralAct, error: actError } = await supabase
            .from('electoral_acts')
            .insert({
              election_id: election.id,
              municipality_idm: municipality.idm,
              district: mesaInfo.district,
              section: mesaInfo.section,
              table_letter: mesaInfo.table_letter,
              census_total: 0, // INDRA files might not have this
              total_voters: 0, // Will be calculated from votes
              blank_votes: 0,
              null_votes: 0,
              source_type: 'indra'
            })
            .select('id')
            .single();

          if (actError) {
            console.error('Error creating electoral act:', actError);
            result.errors.push(`Row ${result.processedRows}: Failed to create act - ${actError.message}`);
            continue;
          }

          result.createdActs++;
          let totalVotes = 0;

          // Process party votes (skip codmun and mesa columns)
          for (const [key, value] of Object.entries(row)) {
            if (key === 'codmun' || key === 'mesa') continue;

            const votes = parseInt(value as string) || 0;
            if (votes <= 0) continue;

            try {
              const partyId = await ensurePartyExists(key);
              
              const { error: voteError } = await supabase
                .from('party_votes')
                .insert({
                  electoral_act_id: electoralAct.id,
                  party_id: partyId,
                  votes: votes
                });

              if (voteError) {
                console.error('Error creating party vote:', voteError);
                result.errors.push(`Row ${result.processedRows}: Failed to create vote for ${key} - ${voteError.message}`);
              } else {
                result.createdVotes++;
                totalVotes += votes;
              }
            } catch (partyError) {
              console.error('Error processing party:', partyError);
              result.errors.push(`Row ${result.processedRows}: Error with party ${key} - ${partyError}`);
            }
          }

          // Update total voters count
          if (totalVotes > 0) {
            await supabase
              .from('electoral_acts')
              .update({ total_voters: totalVotes })
              .eq('id', electoralAct.id);
          }

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

  const uploadIndraFile = async (file: File) => {
    try {
      // Validate file
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos CSV, XLS y XLSX.",
        });
        return;
      }

      const result = await processIndraFile(file);

      if (result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Procesamiento completado con errores",
          description: `Se procesaron ${result.processedRows} filas. ${result.errors.length} errores encontrados.`,
        });
        console.error('Processing errors:', result.errors);
      } else {
        toast({
          title: "Archivo INDRA procesado exitosamente",
          description: `Se crearon ${result.createdActs} actas y ${result.createdVotes} votos.`,
        });
      }

      return result;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar archivo",
        description: "No se pudo procesar el archivo INDRA.",
      });
    }
  };

  return {
    uploadIndraFile,
    processing
  };
};
