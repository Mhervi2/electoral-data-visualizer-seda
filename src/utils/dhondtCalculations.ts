import { calculateDHondt, DHondtResult, PartyVotes } from './dhondt';

export interface ProvincialResult {
  provincia: string;
  totalSeats: number;
  parties: DHondtResult[];
  totalVotes: number;
}

export interface AutonomousResult {
  comunidadAutonoma: string;
  totalSeats: number;
  parties: Array<{
    name: string;
    seats: number;
    votes: number;
    provinces: ProvincialResult[];
  }>;
  totalVotes: number;
}

export const calculateProvincialSeats = (
  partyVotes: Array<{ party_id: string; votes: number; provincia: string }>,
  politicalParties: Array<{ id: string; name: string; siglas: string }>,
  provincialSeats: Array<{ provincia: string; seats: number }>
): ProvincialResult[] => {
  const provinceMap = new Map<string, Map<string, number>>();

  // Group votes by province and party
  partyVotes.forEach(({ party_id, votes, provincia }) => {
    if (!provinceMap.has(provincia)) {
      provinceMap.set(provincia, new Map());
    }
    const partyMap = provinceMap.get(provincia)!;
    partyMap.set(party_id, (partyMap.get(party_id) || 0) + votes);
  });

  const results: ProvincialResult[] = [];

  // Calculate D'Hondt for each province
  provinceMap.forEach((partyMap, provincia) => {
    const seatData = provincialSeats.find(ps => ps.provincia === provincia);
    if (!seatData || seatData.seats === 0) return;

    const parties: PartyVotes[] = [];
    let totalVotes = 0;

    partyMap.forEach((votes, partyId) => {
      const party = politicalParties.find(p => p.id === partyId);
      if (party && votes > 0) {
        parties.push({
          name: party.siglas || party.name,
          votes
        });
        totalVotes += votes;
      }
    });

    if (parties.length > 0) {
      const dhondtResults = calculateDHondt(parties, seatData.seats);
      results.push({
        provincia,
        totalSeats: seatData.seats,
        parties: dhondtResults,
        totalVotes
      });
    }
  });

  return results.sort((a, b) => a.provincia.localeCompare(b.provincia));
};

export const aggregateAutonomousSeats = (
  provincialResults: ProvincialResult[],
  mpcaData: Array<{ provincia: string; ca: string }>
): AutonomousResult[] => {
  const autonomousMap = new Map<string, Map<string, { seats: number; votes: number; provinces: ProvincialResult[] }>>();

  provincialResults.forEach(provincialResult => {
    const mpca = mpcaData.find(m => m.provincia === provincialResult.provincia);
    if (!mpca) return;

    const ca = mpca.ca;
    if (!autonomousMap.has(ca)) {
      autonomousMap.set(ca, new Map());
    }

    const caMap = autonomousMap.get(ca)!;

    provincialResult.parties.forEach(party => {
      if (!caMap.has(party.name)) {
        caMap.set(party.name, { seats: 0, votes: 0, provinces: [] });
      }
      const partyData = caMap.get(party.name)!;
      partyData.seats += party.seats;
      partyData.votes += party.votes;
      
      // Add this provincial result to the party's provinces if it has seats
      if (party.seats > 0) {
        partyData.provinces.push(provincialResult);
      }
    });
  });

  const results: AutonomousResult[] = [];

  autonomousMap.forEach((partyMap, comunidadAutonoma) => {
    let totalSeats = 0;
    let totalVotes = 0;
    const parties: AutonomousResult['parties'] = [];

    partyMap.forEach((data, partyName) => {
      if (data.seats > 0) {
        parties.push({
          name: partyName,
          seats: data.seats,
          votes: data.votes,
          provinces: data.provinces
        });
        totalSeats += data.seats;
      }
      totalVotes += data.votes;
    });

    if (parties.length > 0) {
      parties.sort((a, b) => b.seats - a.seats);
      results.push({
        comunidadAutonoma,
        totalSeats,
        parties,
        totalVotes
      });
    }
  });

  return results.sort((a, b) => a.comunidadAutonoma.localeCompare(b.comunidadAutonoma));
};