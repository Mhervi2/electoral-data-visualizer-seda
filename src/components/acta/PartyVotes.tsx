
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PoliticalParty } from '@/types/acta';
import { usePartyOrder } from '@/hooks/usePartyOrder';
import { useState } from 'react';

interface PartyVotesProps {
  politicalParties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
  provincia?: string;
}

export const PartyVotes = ({ politicalParties, votos, onVoteChange, provincia }: PartyVotesProps) => {
  const { orderedParties, loading } = usePartyOrder(provincia, politicalParties);
  const [selectedParty, setSelectedParty] = useState<PoliticalParty | null>(null);
  const [inputValue, setInputValue] = useState('');

  if (!politicalParties || politicalParties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Votos a Candidaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay partidos políticos disponibles. Cargando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Votos a Candidaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando orden de partidos...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePartyClick = (party: PoliticalParty) => {
    setSelectedParty(party);
    setInputValue(votos[party.id] || '');
  };

  const handleInputSubmit = () => {
    if (selectedParty && inputValue !== '') {
      onVoteChange(selectedParty.id, inputValue);
    }
    setSelectedParty(null);
    setInputValue('');
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (selectedParty) {
      onVoteChange(selectedParty.id, value);
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Votos a Candidaturas</CardTitle>
          {selectedParty && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Introduciendo votos para:</span>
              <Badge 
                variant="outline" 
                style={{ borderColor: selectedParty.color }}
                className="text-sm"
              >
                {selectedParty.siglas} - {selectedParty.name}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campo de entrada central */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-xs">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={selectedParty ? `Votos para ${selectedParty.siglas}` : "Selecciona un partido"}
                className="text-center text-lg h-12"
                min="0"
                disabled={!selectedParty}
              />
            </div>
            {selectedParty && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInputSubmit}>
                  Confirmar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSelectedParty(null);
                    setInputValue('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Grid de botones de partidos */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {orderedParties.map(partido => (
              <Tooltip key={partido.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedParty?.id === partido.id ? "default" : "outline"}
                    className={`h-16 p-2 flex flex-col items-center justify-center relative transition-all ${
                      votos[partido.id] ? 'ring-2 ring-green-500' : ''
                    }`}
                    style={{
                      borderColor: partido.color,
                      color: selectedParty?.id === partido.id ? 'white' : partido.color,
                      backgroundColor: selectedParty?.id === partido.id ? partido.color : 'transparent'
                    }}
                    onClick={() => handlePartyClick(partido)}
                  >
                    <div className="font-bold text-xs">{partido.siglas}</div>
                    {votos[partido.id] && (
                      <div className="text-xs mt-1 font-semibold">
                        {votos[partido.id]}
                      </div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <div className="font-semibold">{partido.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {votos[partido.id] ? `${votos[partido.id]} votos` : 'Sin votos'}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Resumen de votos introducidos */}
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Votos introducidos: {Object.values(votos).filter(v => v).length} partidos
            </div>
            <div className="flex flex-wrap gap-2">
              {orderedParties
                .filter(partido => votos[partido.id])
                .map(partido => (
                  <Badge 
                    key={partido.id}
                    variant="secondary"
                    style={{ borderColor: partido.color }}
                    className="text-xs"
                  >
                    {partido.siglas}: {votos[partido.id]}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
