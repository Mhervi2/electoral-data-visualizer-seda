
import { supabase } from '@/integrations/supabase/client';

export const findMunicipalityByCode = async (codmun: string): Promise<any> => {
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

export const ensurePartyExists = async (partyName: string): Promise<string> => {
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

export const getActiveElection = async () => {
  const { data: election, error } = await supabase
    .from('elections')
    .select('id')
    .eq('status', 'active')
    .single();

  if (error || !election) {
    throw new Error('No active election found');
  }

  return election;
};
