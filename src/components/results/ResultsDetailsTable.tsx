
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResultsDetailsTableProps {
  partyResults: {
    party: {
      name: string;
      siglas: string;
      color: string;
    };
    votes: number;
    percentage: number;
  }[];
  totalVotes: number;
}

export const ResultsDetailsTable = ({ partyResults, totalVotes }: ResultsDetailsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Detallados por Partido</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partido</TableHead>
              <TableHead>Siglas</TableHead>
              <TableHead className="text-right">Votos</TableHead>
              <TableHead className="text-right">Porcentaje</TableHead>
              <TableHead className="text-right">% del Total</TableHead>
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
                  {result.votes.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {result.percentage.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono">
                  {totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(2) : 0}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
