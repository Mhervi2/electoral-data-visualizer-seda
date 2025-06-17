
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PoliticalParty } from '@/types/acta';

interface PartyVotesProps {
  politicalParties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
}

export const PartyVotes = ({ politicalParties, votos, onVoteChange }: PartyVotesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votos a Candidaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {politicalParties.map(partido => (
            <div key={partido.id} className="flex items-center space-x-4">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: partido.color }}
                title={`Color del partido: ${partido.color}`}
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
