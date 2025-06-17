
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
  color: string; // Añadida propiedad color que existe en la BD
}

export interface Election {
  id: string;
  name: string;
  status: string;
}

export interface ExistingAct {
  id: string;
  municipality: { name: string };
  district: string;
  section: string;
  table_letter: string;
  source_type: string;
  created_at: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  party_votes: Array<{
    votes: number;
    political_parties: {
      name: string;
      siglas: string;
      color: string; // Añadida propiedad color
    };
  }>;
}

export interface ActaData {
  electionId: string;
  municipio: string;
  distrito: string;
  seccion: string;
  mesa: string;
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  votos: { [key: string]: string };
  imagen?: File;
  imageUrl?: string;
}
