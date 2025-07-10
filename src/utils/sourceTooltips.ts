
export const getSourceTooltip = (sourceType: string): string | null => {
  const tooltips: { [key: string]: string } = {
    'indra': 'Escrutinio provisional',
    'escrutinio': 'JEP: Escrutinio definitivo',
    'oficial': 'Resultados BOE'
  };
  
  return tooltips[sourceType.toLowerCase()] || null;
};
