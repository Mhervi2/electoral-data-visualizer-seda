
import { supabase } from '@/integrations/supabase/client';
import { extractMesaInfo } from '@/utils/indraFileParser';
import { findMunicipalityByCode, ensurePartyExists } from './indraDataService';

interface IndraRow {
  codmun: string;
  mesa: string;
  [partyName: string]: string | number;
}

export const createElectoralActFromIndraRow = async (
  row: IndraRow, 
  electionId: string
): Promise<{ actId: string; totalVotes: number }> => {
  // Extract municipality and mesa info
  const municipality = await findMunicipalityByCode(row.codmun);
  const mesaInfo = extractMesaInfo(row.mesa);

  // Create electoral act
  const { data: electoralAct, error: actError } = await supabase
    .from('electoral_acts')
    .insert({
      election_id: electionId,
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
    throw new Error(`Failed to create electoral act: ${actError.message}`);
  }

  return { actId: electoralAct.id, totalVotes: 0 };
};

export const createPartyVotesForAct = async (
  row: IndraRow, 
  actId: string
): Promise<{ createdVotes: number; totalVotes: number }> => {
  let createdVotes = 0;
  let totalVotes = 0;

  // Process party votes (skip codmun and mesa columns)
  for (const [key, value] of Object.entries(row)) {
    if (key === 'codmun' || key === 'mesa') continue;

    const votes = parseInt(value as string) || 0;
    if (votes <= 0) continue;

    const partyId = await ensurePartyExists(key);
    
    const { error: voteError } = await supabase
      .from('party_votes')
      .insert({
        electoral_act_id: actId,
        party_id: partyId,
        votes: votes
      });

    if (voteError) {
      throw new Error(`Failed to create vote for ${key}: ${voteError.message}`);
    }

    createdVotes++;
    totalVotes += votes;
  }

  // Update total voters count
  if (totalVotes > 0) {
    await supabase
      .from('electoral_acts')
      .update({ total_voters: totalVotes })
      .eq('id', actId);
  }

  return { createdVotes, totalVotes };
};
