
import { useState } from 'react';
import { ActaData, MpcaData, MailVoter } from '@/types/acta';

export const useActaFormState = () => {
  const [selectedMpcaRecord, setSelectedMpcaRecord] = useState<MpcaData | null>(null);
  const [actaData, setActaData] = useState<ActaData>({
    electionId: '',
    municipio: '',
    mesaIdentifier: '',
    censo: '',
    votantes: '',
    blancos: '',
    nulos: '',
    votos: {},
    mailVoters: [],
    observations: '',
  });

  const handleMunicipalityChange = (municipalityId: string, municipalityData: MpcaData | null) => {
    console.log('Municipality selected:', municipalityId, municipalityData);
    setSelectedMpcaRecord(municipalityData);
    setActaData(prev => ({ ...prev, municipio: municipalityId }));
  };

  const handleInputChange = (field: keyof ActaData, value: string) => {
    setActaData(prev => ({ ...prev, [field]: value }));
  };

  const handleVoteChange = (partidoId: string, votes: string) => {
    setActaData(prev => ({
      ...prev,
      votos: { ...prev.votos, [partidoId]: votes }
    }));
  };

  const handleMailVotersChange = (mailVoters: MailVoter[]) => {
    setActaData(prev => ({ ...prev, mailVoters }));
  };

  const resetForm = () => {
    setActaData({
      electionId: '',
      municipio: '',
      mesaIdentifier: '',
      censo: '',
      votantes: '',
      blancos: '',
      nulos: '',
      votos: {},
      mailVoters: [],
      observations: '',
    });
    setSelectedMpcaRecord(null);
  };

  return {
    actaData,
    selectedMpcaRecord,
    handleMunicipalityChange,
    handleInputChange,
    handleVoteChange,
    handleMailVotersChange,
    resetForm
  };
};
