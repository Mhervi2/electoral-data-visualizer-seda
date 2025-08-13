
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { MailVoter } from '@/types/acta';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface MailVotersSectionProps {
  mailVoters: MailVoter[];
  onMailVotersChange: (mailVoters: MailVoter[]) => void;
}

export const MailVotersSection = ({ mailVoters, onMailVotersChange }: MailVotersSectionProps) => {
  const { isMailVotingEnabled } = useSystemSettings();

  // Don't render if mail voting is disabled
  if (!isMailVotingEnabled()) {
    return null;
  }
  const addMailVoter = () => {
    onMailVotersChange([...mailVoters, { dni: '' }]);
  };

  const removeMailVoter = (index: number) => {
    const newMailVoters = mailVoters.filter((_, i) => i !== index);
    onMailVotersChange(newMailVoters);
  };

  const updateMailVoter = (index: number, field: keyof MailVoter, value: string) => {
    const newMailVoters = mailVoters.map((voter, i) => 
      i === index ? { ...voter, [field]: value } : voter
    );
    onMailVotersChange(newMailVoters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Voto por Correo
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addMailVoter}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir Votante
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mailVoters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay votantes por correo registrados. Haz clic en "Añadir Votante" para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {mailVoters.map((voter, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor={`dni-${index}`} className="text-sm font-medium">
                    DNI
                  </Label>
                  <Input
                    id={`dni-${index}`}
                    type="text"
                    placeholder="12345678A"
                    value={voter.dni}
                    onChange={(e) => updateMailVoter(index, 'dni', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMailVoter(index)}
                  className="flex items-center gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {mailVoters.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total votantes por correo: <span className="font-medium">{mailVoters.length}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
