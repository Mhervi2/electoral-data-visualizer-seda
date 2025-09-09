import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PoliticalParty } from '@/types/acta';
import { usePartyOrder } from '@/hooks/usePartyOrder';
import { VotesSummaryDialog } from './VotesSummaryDialog';
import { useState } from 'react';

interface PartyVotesProps {
  politicalParties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
  provincia?: string;
}

export const PartyVotes = ({ politicalParties, votos, onVoteChange, provincia }: PartyVotesProps) => {
  const { orderedParties, loading } = usePartyOrder(provincia, politicalParties);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

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

  const totalVotesEntered = Object.values(votos).filter(v => v && v !== '0').length;

  return (
    <>
      <VotesSummaryDialog
        open={showSummaryDialog}
        onOpenChange={setShowSummaryDialog}
        politicalParties={politicalParties}
        votos={votos}
        onVoteChange={onVoteChange}
        provincia={provincia}
      />
      
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Votos a Candidaturas</span>
              {totalVotesEntered > 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200">
                  {totalVotesEntered} partido{totalVotesEntered !== 1 ? 's' : ''} con votos
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid de partidos con inputs integrados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {orderedParties.map(partido => (
              <Tooltip key={partido.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={`relative border rounded-lg p-3 transition-all ${
                      votos[partido.id] && votos[partido.id] !== '0' 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:shadow-md'
                    }`}
                    style={{ borderColor: partido.color }}
                  >
                    <div className="text-center space-y-2">
                      <div 
                        className="font-bold text-sm px-2 py-1 rounded text-white"
                        style={{ backgroundColor: partido.color }}
                      >
                        {partido.siglas}
                      </div>
                      <Input
                        type="number"
                        value={votos[partido.id] || ''}
                        onChange={(e) => onVoteChange(partido.id, e.target.value)}
                        placeholder="Votos"
                        className="text-center h-8 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <div className="font-semibold">{partido.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {votos[partido.id] && votos[partido.id] !== '0' 
                        ? `${votos[partido.id]} votos` 
                        : 'Sin votos'}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Botón de resumen */}
          <div className="flex justify-center pt-4 border-t">
            <Button 
              onClick={() => setShowSummaryDialog(true)}
              disabled={totalVotesEntered === 0}
              variant="outline"
              className="px-8"
            >
              Ver Resumen de Votos ({totalVotesEntered} partido{totalVotesEntered !== 1 ? 's' : ''})
            </Button>
          </div>

          {/* Resumen de votos introducidos */}
          {totalVotesEntered > 0 && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                Resumen de votos: {totalVotesEntered} de {orderedParties.length} partidos
              </div>
              <div className="flex flex-wrap gap-2">
                {orderedParties
                  .filter(partido => votos[partido.id] && votos[partido.id] !== '0')
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
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
    </>
  );
};