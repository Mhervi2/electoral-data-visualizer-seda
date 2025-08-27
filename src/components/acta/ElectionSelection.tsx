
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Election } from '@/types/acta';

interface ElectionSelectionProps {
  elections: Election[];
  selectedElectionId: string;
  onElectionChange: (value: string) => void;
  autoSelectActive?: boolean;
}

export const ElectionSelection = ({ elections, selectedElectionId, onElectionChange, autoSelectActive = false }: ElectionSelectionProps) => {
  // Auto-select active election if enabled and no election is currently selected
  React.useEffect(() => {
    if (autoSelectActive && !selectedElectionId && elections.length > 0) {
      const activeElection = elections.find(election => election.status === 'active');
      if (activeElection) {
        onElectionChange(activeElection.id);
      }
    }
  }, [autoSelectActive, selectedElectionId, elections, onElectionChange]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selección de Elección</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="election">Elección *</Label>
          <Select value={selectedElectionId} onValueChange={onElectionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar elección" />
            </SelectTrigger>
            <SelectContent>
              {elections.map(election => (
                <SelectItem key={election.id} value={election.id}>
                  {election.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
