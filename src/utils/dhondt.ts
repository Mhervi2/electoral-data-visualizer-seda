
export interface PartyVotes {
  name: string;
  votes: number;
}

export interface DHondtResult extends PartyVotes {
  seats: number;
  quotients: number[];
}

export const calculateDHondt = (parties: PartyVotes[], totalSeats: number): DHondtResult[] => {
  if (parties.length === 0 || totalSeats <= 0) {
    return [];
  }

  // Initialize results with zero seats
  const results: DHondtResult[] = parties.map(party => ({
    ...party,
    seats: 0,
    quotients: []
  }));

  // Calculate all possible quotients for each party
  const quotients: Array<{ value: number; partyIndex: number; seatNumber: number }> = [];
  
  for (let i = 0; i < parties.length; i++) {
    for (let seat = 1; seat <= totalSeats; seat++) {
      quotients.push({
        value: parties[i].votes / seat,
        partyIndex: i,
        seatNumber: seat
      });
    }
  }

  // Sort quotients in descending order
  quotients.sort((a, b) => b.value - a.value);

  // Assign seats based on highest quotients
  for (let i = 0; i < totalSeats && i < quotients.length; i++) {
    const quotient = quotients[i];
    results[quotient.partyIndex].seats++;
    results[quotient.partyIndex].quotients.push(quotient.value);
  }

  return results.sort((a, b) => b.seats - a.seats);
};
