
export interface MpcaData {
  idm: number;
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
}

export interface PoliticalParty {
  id: string;
  name: string;
  siglas: string;
  color: string;
}

export interface Election {
  id: string;
  name: string;
  status: string;
}

export interface ActaData {
  electionId: string;
  municipio: string;
  mesaIdentifier: string; // Nuevo campo unificado
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  votos: { [key: string]: string };
  imagen?: File;
  imageUrl?: string;
}

export interface ExistingAct {
  id: string;
  mesa_identifier: string; // Nuevo campo unificado
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  created_at: string;
  municipality: { name: string };
  party_votes: {
    votes: number;
    political_parties: {
      name: string;
      siglas: string;
      color: string;
    };
  }[];
}
