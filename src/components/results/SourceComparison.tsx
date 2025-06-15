
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SourceComparisonProps {
  sourceComparison: {
    source: string;
    totalVotes: number;
    coverage: number;
  }[];
}

export const SourceComparison = ({ sourceComparison }: SourceComparisonProps) => {
  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Actas de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const getSourceTypeBadgeVariant = (sourceType: string) => {
    const variants = {
      'user': 'default',
      'indra': 'secondary',
      'escrutinio': 'outline',
      'oficial': 'destructive'
    };
    return variants[sourceType as keyof typeof variants] || 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de Datos a Comparar</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fuente</TableHead>
              <TableHead className="text-right">Total Votos</TableHead>
              <TableHead className="text-right">Cobertura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sourceComparison.map((source) => (
              <TableRow key={source.source}>
                <TableCell>
                  <Badge variant={getSourceTypeBadgeVariant(source.source) as any}>
                    {getSourceTypeLabel(source.source)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {source.totalVotes.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {source.coverage.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
