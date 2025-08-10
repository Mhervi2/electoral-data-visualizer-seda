import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProvincialSeats } from '@/hooks/useProvincialSeats';
import { useElections } from '@/hooks/useElections';
import { Save, RefreshCw } from 'lucide-react';

export const ProvincialSeatsManager = () => {
  const { elections } = useElections();
  const [selectedElection, setSelectedElection] = useState<string>('default');
  const { provincialSeats, loading, updateProvincialSeat, refetch } = useProvincialSeats(selectedElection === 'default' ? '' : selectedElection);
  const [editingSeats, setEditingSeats] = useState<Record<string, number>>({});

  const handleSeatChange = (provincia: string, seats: string) => {
    const seatNumber = parseInt(seats) || 0;
    setEditingSeats(prev => ({ ...prev, [provincia]: seatNumber }));
  };

  const handleSave = async (provincia: string) => {
    const seats = editingSeats[provincia];
    if (seats !== undefined && seats > 0) {
      await updateProvincialSeat(provincia, seats, selectedElection === 'default' ? undefined : selectedElection);
      setEditingSeats(prev => {
        const newState = { ...prev };
        delete newState[provincia];
        return newState;
      });
    }
  };

  const getCurrentSeats = (provincia: string) => {
    if (editingSeats[provincia] !== undefined) {
      return editingSeats[provincia];
    }
    return provincialSeats.find(ps => ps.provincia === provincia)?.seats || 0;
  };

  const hasChanges = (provincia: string) => {
    return editingSeats[provincia] !== undefined;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Gestión de Escaños Provinciales
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <div className="space-y-2">
          <Label htmlFor="election-select">Elección (opcional)</Label>
          <Select value={selectedElection} onValueChange={setSelectedElection}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar elección específica o usar valores por defecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Valores por defecto (aplicable a todas las elecciones)</SelectItem>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provincia</TableHead>
                <TableHead>Escaños</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {provincialSeats.map((seat) => (
                <TableRow key={seat.provincia}>
                  <TableCell className="font-medium">{seat.provincia}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={getCurrentSeats(seat.provincia)}
                      onChange={(e) => handleSeatChange(seat.provincia, e.target.value)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    {hasChanges(seat.provincia) && (
                      <Button
                        size="sm"
                        onClick={() => handleSave(seat.provincia)}
                        className="h-8"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Total de escaños: 
            </span>
            <span className="font-semibold text-lg">
              {provincialSeats.reduce((total, seat) => total + getCurrentSeats(seat.provincia), 0)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              Los valores mostrados corresponden a la distribución de escaños para el Congreso de los Diputados.
              Puede modificar estos valores según la elección específica si es necesario.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};