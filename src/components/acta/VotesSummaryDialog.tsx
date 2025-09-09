import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PoliticalParty } from '@/types/acta';
import { usePartyOrder } from '@/hooks/usePartyOrder';

interface VotesSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  politicalParties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
  provincia?: string;
}

export const VotesSummaryDialog: React.FC<VotesSummaryDialogProps> = ({
  open,
  onOpenChange,
  politicalParties,
  votos,
  onVoteChange,
  provincia
}) => {
  const { orderedParties } = usePartyOrder(provincia, politicalParties);
  const [localVotes, setLocalVotes] = useState<{ [key: string]: string }>({});

  // Initialize local votes when dialog opens
  useEffect(() => {
    if (open) {
      setLocalVotes({ ...votos });
    }
  }, [open, votos]);

  // Filter parties that have votes
  const partiesWithVotes = orderedParties.filter(party => 
    localVotes[party.id] && localVotes[party.id] !== '0' && localVotes[party.id] !== ''
  );

  const totalVotes = partiesWithVotes.reduce((sum, party) => 
    sum + (parseInt(localVotes[party.id]) || 0), 0
  );

  const handleLocalVoteChange = (partidoId: string, votes: string) => {
    setLocalVotes(prev => ({ ...prev, [partidoId]: votes }));
  };

  const handleSaveChanges = () => {
    // Apply all local changes to the parent component
    Object.keys(localVotes).forEach(partidoId => {
      if (localVotes[partidoId] !== votos[partidoId]) {
        onVoteChange(partidoId, localVotes[partidoId]);
      }
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset local changes
    setLocalVotes({ ...votos });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumen de Votos por Candidaturas</DialogTitle>
          <DialogDescription>
            Revisa y edita los votos asignados a cada partido. Solo se muestran los partidos con votos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumen General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Partidos con votos:</span>
                <Badge variant="secondary">{partiesWithVotes.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de votos:</span>
                <Badge variant="default">{totalVotes.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Parties with votes */}
          {partiesWithVotes.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Candidaturas con votos asignados:
              </h4>
              <div className="grid gap-3">
                {partiesWithVotes.map(party => (
                  <Card key={party.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: party.color }}
                      >
                        {party.siglas}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{party.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {party.siglas}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={localVotes[party.id] || ''}
                          onChange={(e) => handleLocalVoteChange(party.id, e.target.value)}
                          className="w-24 text-center"
                          min="0"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground min-w-0">votos</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No hay votos asignados a ningún partido todavía.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSaveChanges} disabled={partiesWithVotes.length === 0}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};