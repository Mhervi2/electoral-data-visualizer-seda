import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSourceTooltip } from '@/utils/sourceTooltips';

interface SourceMetrics {
  source: string;
  totalCensus: number;
  totalVotes: number;
  participation: number;
  abstention: number;
  abstentionPercentage: number;
  blankVotes: number;
  nullVotes: number;
  validVotes: number;
}

interface ElectoralSummaryTableProps {
  sourceMetrics: SourceMetrics[];
}

const sourceDisplayNames: { [key: string]: string } = {
  user: 'Usuario',
  indra: 'Indra',
  escrutinio: 'Escrutinio',
  oficial: 'Oficial'
};

export const ElectoralSummaryTable = ({ sourceMetrics }: ElectoralSummaryTableProps) => {
  const metrics = [
    { key: 'totalCensus', label: 'Censo Total', format: (value: number) => value.toLocaleString() },
    { key: 'totalVotes', label: 'Total Votantes', format: (value: number) => value.toLocaleString() },
    { key: 'participation', label: 'Participación', format: (value: number) => `${value.toFixed(1)}%` },
    { key: 'abstentionPercentage', label: 'Abstención', format: (value: number, source: SourceMetrics) => `${source.abstention.toLocaleString()} (${value.toFixed(1)}%)` },
    { key: 'validVotes', label: 'Votos Válidos', format: (value: number) => value.toLocaleString() },
    { key: 'blankVotes', label: 'Votos en Blanco', format: (value: number) => value.toLocaleString() },
    { key: 'nullVotes', label: 'Votos Nulos', format: (value: number) => value.toLocaleString() }
  ];

  const renderSourceName = (source: SourceMetrics) => {
    const displayName = sourceDisplayNames[source.source] || source.source;
    const tooltip = getSourceTooltip(source.source);
    
    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{displayName}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return displayName;
  };

  return (
    <TooltipProvider>
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
                  <TableHead className="font-semibold">Fuente</TableHead>
                  {metrics.map((metric) => (
                    <TableHead key={metric.key} className="text-center font-semibold">
                      {metric.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceMetrics.map((source) => (
                  <TableRow key={source.source}>
                    <TableCell className="font-medium">
                      {renderSourceName(source)}
                    </TableCell>
                    {metrics.map((metric) => (
                      <TableCell key={metric.key} className="text-center">
                        {metric.format.length > 1 
                          ? (metric.format as (value: number, source: SourceMetrics) => string)(source[metric.key as keyof SourceMetrics] as number, source)
                          : (metric.format as (value: number) => string)(source[metric.key as keyof SourceMetrics] as number)
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
