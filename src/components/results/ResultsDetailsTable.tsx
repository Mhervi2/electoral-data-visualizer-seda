
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PartyResultBySource {
  party: {
    name: string;
    siglas: string;
    color: string;
  };
  totalVotes: number;
  percentage: number;
  sourceResults: {
    [sourceType: string]: {
      votes: number;
      percentage: number;
    };
  };
}

interface ResultsDetailsTableProps {
  partyResults: PartyResultBySource[];
  totalVotes: number;
  selectedSources: string[];
}

export const ResultsDetailsTable = ({ partyResults, totalVotes, selectedSources }: ResultsDetailsTableProps) => {
  const getSourceLabel = (sourceType: string) => {
    const labels = {
      'user': 'Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio',
      'oficial': 'Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Detallados por Partido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Siglas</TableHead>
                <TableHead className="text-right">Total Votos</TableHead>
                <TableHead className="text-right">% Total</TableHead>
                {selectedSources.map(sourceType => (
                  <TableHead key={sourceType} className="text-right">
                    {getSourceLabel(sourceType)} (Votos)
                  </TableHead>
                ))}
                {selectedSources.map(sourceType => (
                  <TableHead key={`${sourceType}-percent`} className="text-right">
                    {getSourceLabel(sourceType)} (%)
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {partyResults.map((result, index) => (
                <TableRow key={result.party.siglas}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: result.party.color }}
                      />
                      <span className="font-medium">{result.party.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{result.party.siglas}</TableCell>
                  <TableCell className="text-right font-mono">
                    {result.totalVotes.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {result.percentage.toFixed(2)}%
                  </TableCell>
                  {selectedSources.map(sourceType => (
                    <TableCell key={sourceType} className="text-right font-mono">
                      {(result.sourceResults[sourceType]?.votes || 0).toLocaleString()}
                    </TableCell>
                  ))}
                  {selectedSources.map(sourceType => (
                    <TableCell key={`${sourceType}-percent`} className="text-right font-mono">
                      {(result.sourceResults[sourceType]?.percentage || 0).toFixed(2)}%
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
