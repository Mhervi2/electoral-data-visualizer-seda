
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PoliticalParty } from '@/types/acta';
import { usePartyOrder } from '@/hooks/usePartyOrder';

interface PartyVotesProps {
  politicalParties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
  provincia?: string;
}

export const PartyVotes = ({ politicalParties, votos, onVoteChange, provincia }: PartyVotesProps) => {
  const { orderedParties, loading } = usePartyOrder(provincia, politicalParties);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votos a Candidaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orderedParties.map(partido => (
            <div key={partido.id} className="flex items-center space-x-4">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: partido.color || '#6B7280' }}
                title={`Color del partido: ${partido.color || '#6B7280'}`}
              />
              <div className="w-20 text-sm font-medium">{partido.siglas}</div>
              <div className="flex-1 text-sm">{partido.name}</div>
              <Input
                type="number"
                value={votos[partido.id] || ''}
                onChange={(e) => onVoteChange(partido.id, e.target.value)}
                className="w-24"
                placeholder="0"
                min="0"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
