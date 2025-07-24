import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface DHondtResultsProps {
  provincialResults?: ProvincialResult[];
  autonomousResults?: AutonomousResult[];
  title: string;
}

export const DHondtResults = ({ provincialResults, autonomousResults, title }: DHondtResultsProps) => {
  if (!provincialResults && !autonomousResults) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Distribución de escaños calculada según el método D'Hondt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {provincialResults && (
          <div className="space-y-6">
            {provincialResults.map((result) => (
              <div key={result.provincia}>
                <h4 className="font-semibold mb-2">
                  {result.provincia} ({result.totalSeats} escaños)
                </h4>
                <div className="rounded-md border">
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
                      {result.parties.map((party) => (
                        <TableRow key={party.name}>
                          <TableCell className="font-medium">{party.name}</TableCell>
                          <TableCell className="text-right">{party.votes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {((party.votes / result.totalVotes) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={party.seats > 0 ? "default" : "secondary"}>
                              {party.seats}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}

        {autonomousResults && (
          <div className="space-y-6">
            {autonomousResults.map((result) => (
              <div key={result.comunidadAutonoma}>
                <h4 className="font-semibold mb-2">
                  {result.comunidadAutonoma} ({result.totalSeats} escaños)
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partido</TableHead>
                        <TableHead className="text-right">Votos</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Escaños</TableHead>
                        <TableHead>Provincias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.parties.map((party) => (
                        <TableRow key={party.name}>
                          <TableCell className="font-medium">{party.name}</TableCell>
                          <TableCell className="text-right">{party.votes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {((party.votes / result.totalVotes) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={party.seats > 0 ? "default" : "secondary"}>
                              {party.seats}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {party.provinces.map((province) => {
                                const provincialParty = province.parties.find(p => p.name === party.name);
                                return (
                                  <Badge key={province.provincia} variant="outline" className="text-xs">
                                    {province.provincia}: {provincialParty?.seats || 0}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};