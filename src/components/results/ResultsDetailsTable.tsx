import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getSourceTooltip } from '@/utils/sourceTooltips';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = partyResults.filter(result => 
    result.party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.party.siglas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceLabel = (sourceType: string) => {
    const labels = {
      'user': 'Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio',
      'oficial': 'Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const renderSourceHeader = (sourceType: string, suffix: string) => {
    const label = getSourceLabel(sourceType);
    const tooltip = getSourceTooltip(sourceType);
    
    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{label} {suffix}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return `${label} ${suffix}`;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Resultados Detallados por Partido</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar partido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partido</TableHead>
                  <TableHead>Siglas</TableHead>
                  {selectedSources.map(sourceType => (
                    <TableHead key={sourceType} className="text-right">
                      {renderSourceHeader(sourceType, '(Votos)')}
                    </TableHead>
                  ))}
                  {selectedSources.map(sourceType => (
                    <TableHead key={`${sourceType}-percent`} className="text-right">
                      {renderSourceHeader(sourceType, '(%)')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result, index) => (
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
    </TooltipProvider>
  );
};
