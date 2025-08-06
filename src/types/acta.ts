
export interface MpcaData {
  idm: number;
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
  idc: string;
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

export interface MailVoter {
  dni: string;
}

export interface ActaData {
  electionId: string;
  municipio: string;
  mesaIdentifier: string;
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  votos: { [key: string]: string };
  imagen?: File;
  imageUrl?: string;
  mailVoters: MailVoter[];
}

export interface ExistingAct {
  id: string;
  mesa_identifier: string;
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

export interface ElectoralAct {
  id: string;
  municipality_idm: number;
  mesa_identifier: string;
  mesa_identifier_full?: string;
  full_identifier?: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
}
