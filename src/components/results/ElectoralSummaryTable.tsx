
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SourceMetrics {
  source: string;
  totalCensus: number;
  totalVotes: number;
  participation: number;
  blankVotes: number;
  nullVotes: number;
  validVotes: number;
}

interface ElectoralSummaryTableProps {
  sourceMetrics: SourceMetrics[];
  totalMetrics: {
    totalCensus: number;
    totalVotes: number;
    participation: number;
    blankVotes: number;
    nullVotes: number;
    validVotes: number;
  };
}

const sourceDisplayNames: { [key: string]: string } = {
  user: 'Usuario',
  indra: 'Indra',
  escrutinio: 'Escrutinio',
  oficial: 'Oficial'
};

export const ElectoralSummaryTable = ({ sourceMetrics, totalMetrics }: ElectoralSummaryTableProps) => {
  const metrics = [
    { key: 'totalCensus', label: 'Censo Total', format: (value: number) => value.toLocaleString() },
    { key: 'totalVotes', label: 'Total Votantes', format: (value: number) => value.toLocaleString() },
    { key: 'participation', label: 'Participación', format: (value: number) => `${value.toFixed(1)}%` },
    { key: 'validVotes', label: 'Votos Válidos', format: (value: number) => value.toLocaleString() },
    { key: 'blankVotes', label: 'Votos en Blanco', format: (value: number) => value.toLocaleString() },
    { key: 'nullVotes', label: 'Votos Nulos', format: (value: number) => value.toLocaleString() }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Resumen Electoral por Fuente de Datos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Métrica</TableHead>
                {sourceMetrics.map((source) => (
                  <TableHead key={source.source} className="text-center font-semibold">
                    {sourceDisplayNames[source.source] || source.source}
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold bg-muted/50">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.key}>
                  <TableCell className="font-medium">
                    {metric.label}
                  </TableCell>
                  {sourceMetrics.map((source) => (
                    <TableCell key={source.source} className="text-center">
                      {metric.format(source[metric.key as keyof SourceMetrics] as number)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold bg-muted/50">
                    {metric.format(totalMetrics[metric.key as keyof typeof totalMetrics])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
