
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { calculateDHondt, type PartyVotes, type DHondtResult } from '@/utils/dhondt';

const DHondtCalculator = () => {
  const [totalSeats, setTotalSeats] = useState<number>(350);
  const [minimumThreshold, setMinimumThreshold] = useState<number>(0);
  const [parties, setParties] = useState<PartyVotes[]>([
    { name: 'Partido 1', votes: 0 },
    { name: 'Partido 2', votes: 0 }
  ]);
  const [results, setResults] = useState<DHondtResult[]>([]);
  const [excludedParties, setExcludedParties] = useState<PartyVotes[]>([]);

  const addParty = () => {
    setParties([...parties, { name: `Partido ${parties.length + 1}`, votes: 0 }]);
  };

  const removeParty = (index: number) => {
    if (parties.length > 2) {
      setParties(parties.filter((_, i) => i !== index));
    }
  };

  const updateParty = (index: number, field: 'name' | 'votes', value: string | number) => {
    const updatedParties = [...parties];
    if (field === 'name') {
      updatedParties[index].name = value as string;
    } else {
      updatedParties[index].votes = Math.max(0, Number(value));
    }
    setParties(updatedParties);
  };

  const calculateResults = () => {
    const validParties = parties.filter(party => party.votes > 0);
    if (validParties.length === 0 || totalSeats <= 0) {
      setResults([]);
      setExcludedParties([]);
      return;
    }
    
    const totalValidVotes = validParties.reduce((sum, party) => sum + party.votes, 0);
    const thresholdVotes = (totalValidVotes * minimumThreshold) / 100;
    
    const qualifiedParties = validParties.filter(party => party.votes >= thresholdVotes);
    const excludedByThreshold = validParties.filter(party => party.votes < thresholdVotes);
    
    setExcludedParties(excludedByThreshold);
    
    if (qualifiedParties.length === 0) {
      setResults([]);
      return;
    }
    
    const dhondtResults = calculateDHondt(qualifiedParties, totalSeats);
    setResults(dhondtResults);
  };

  const totalVotes = parties.reduce((sum, party) => sum + party.votes, 0);
  const assignedSeats = results.reduce((sum, party) => sum + party.seats, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Calculadora de Ley D'Hondt</h1>
          <p className="text-muted-foreground">
            Introduce los votos por partido y el total de escaños para calcular la distribución según el método D'Hondt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Cálculo</CardTitle>
            <CardDescription>
              Configura los parámetros para el cálculo de la distribución de escaños.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total de Escaños a Repartir</Label>
              <Input
                id="totalSeats"
                type="number"
                min="1"
                value={totalSeats}
                onChange={(e) => setTotalSeats(Math.max(1, Number(e.target.value)))}
                placeholder="Ej: 350"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumThreshold">Umbral Mínimo Electoral (%)</Label>
              <Input
                id="minimumThreshold"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={minimumThreshold}
                onChange={(e) => setMinimumThreshold(Math.max(0, Math.min(50, Number(e.target.value))))}
                placeholder="Ej: 3 (para 3%)"
              />
              <p className="text-xs text-muted-foreground">
                Los partidos que no alcancen este porcentaje de votos no obtendrán representación.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Partidos y Votos</Label>
                <Button onClick={addParty} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Partido
                </Button>
              </div>

              <div className="space-y-3">
                {parties.map((party, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Nombre del Partido"
                      value={party.name}
                      onChange={(e) => updateParty(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Votos"
                      value={party.votes || ''}
                      onChange={(e) => updateParty(index, 'votes', e.target.value)}
                      className="w-32"
                    />
                    {parties.length > 2 && (
                      <Button
                        onClick={() => removeParty(index)}
                        size="sm"
                        variant="outline"
                        className="px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={calculateResults} className="w-full" size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Distribución de Escaños
            </Button>

            {totalVotes > 0 && (
              <div className="p-3 bg-accent/20 rounded-lg space-y-1">
                <p className="text-sm font-medium">Resumen:</p>
                <p className="text-sm text-muted-foreground">
                  Total de votos: {totalVotes.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Escaños a repartir: {totalSeats}
                </p>
                {minimumThreshold > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Umbral mínimo: {minimumThreshold}% ({Math.floor((totalVotes * minimumThreshold) / 100).toLocaleString()} votos)
                  </p>
                )}
                {results.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Escaños asignados: {assignedSeats}
                  </p>
                )}
                {excludedParties.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Partidos excluidos por umbral: {excludedParties.length}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Distribución</CardTitle>
            <CardDescription>
              Distribución de escaños calculada según el método D'Hondt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partido</TableHead>
                      <TableHead className="text-right">Votos</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Escaños</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.name}</TableCell>
                        <TableCell className="text-right">
                          {result.votes.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {((result.votes / totalVotes) * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {result.seats}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {excludedParties.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800 mb-2">
                      <strong>Partidos excluidos por no alcanzar el umbral mínimo ({minimumThreshold}%):</strong>
                    </p>
                    <div className="space-y-1">
                      {excludedParties.map((party, index) => (
                        <p key={index} className="text-xs text-orange-700">
                          • {party.name}: {party.votes.toLocaleString()} votos ({((party.votes / totalVotes) * 100).toFixed(2)}%)
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {assignedSeats < totalSeats && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Se han asignado {assignedSeats} de {totalSeats} escaños. 
                      Los {totalSeats - assignedSeats} escaños restantes podrían deberse a partidos sin votos o errores en los datos.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-accent/10 rounded-lg">
                  <h4 className="font-medium mb-2">Información sobre el Método D'Hondt:</h4>
                  <p className="text-sm text-muted-foreground">
                    El método D'Hondt es un sistema de representación proporcional que se utiliza para 
                    distribuir escaños en función del número de votos obtenidos. Se divide el número de 
                    votos de cada partido por 1, 2, 3, etc., y se asignan los escaños a los cocientes más altos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Introduce los datos y presiona "Calcular" para ver los resultados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DHondtCalculator;
