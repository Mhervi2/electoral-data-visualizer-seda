import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';

interface DHondtResultsProps {
  provincialResults?: ProvincialResult[];
  autonomousResults?: AutonomousResult[];
  nationalSeats?: { party: string; seats: number; color: string }[];
  title: string;
  filters?: {
    autonomousCommunity: string;
    province: string;
    municipality: string;
  };
}

interface PartyResult {
  party: string;
  votes: number;
  percentage: number;
  seats: number;
  color: string;
  excluded?: boolean;
  reason?: string;
}

export const DHondtResults = ({ 
  provincialResults, 
  autonomousResults, 
  nationalSeats,
  title,
  filters
}: DHondtResultsProps) => {
  
  // Helper function to get party color
  const getPartyColor = (partyName: string): string => {
    const colorMap: { [key: string]: string } = {
      'PP': '#0066CC',
      'PSOE': '#FF0000',
      'VOX': '#00CC00',
      'SUMAR': '#800080',
      'ERC': '#FFD700',
      'JUNTS': '#87CEEB',
      'PNV': '#008000',
      'BILDU': '#8B4513',
      'BNG': '#87CEEB',
      'CC': '#FFFF00',
      'UPN': '#000080'
    };
    return colorMap[partyName] || `hsl(${Math.abs(partyName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`;
  };

  // Process data for display
  const processResultsData = (): { 
    results: PartyResult[], 
    totalSeats: number, 
    totalVotes: number, 
    level: string,
    locationName: string,
    threshold: number 
  } | null => {
    
    // National level
    if (!filters?.autonomousCommunity && !filters?.province && nationalSeats) {
      const totalSeats = nationalSeats.reduce((sum, party) => sum + party.seats, 0);
      const results: PartyResult[] = nationalSeats.map(party => ({
        party: party.party,
        votes: 0, // National seats don't include vote counts
        percentage: (party.seats / totalSeats) * 100,
        seats: party.seats,
        color: party.color || getPartyColor(party.party)
      }));
      
      return {
        results,
        totalSeats,
        totalVotes: 0,
        level: 'Nacional',
        locationName: 'España',
        threshold: 3.0
      };
    }

    // Provincial level
    if (provincialResults && provincialResults.length > 0) {
      const targetProvince = filters?.province;
      const result = targetProvince 
        ? provincialResults.find(r => r.provincia === targetProvince)
        : provincialResults[0];
      
      if (result) {
        const totalVotes = result.totalVotes;
        const totalSeats = result.totalSeats;
        
        const results: PartyResult[] = [
          ...result.parties.map(party => ({
            party: party.name,
            votes: party.votes,
            percentage: (party.votes / totalVotes) * 100,
            seats: party.seats,
            color: getPartyColor(party.name)
          })),
          ...result.excludedParties.map(party => ({
            party: party.name,
            votes: party.votes,
            percentage: (party.votes / totalVotes) * 100,
            seats: 0,
            color: getPartyColor(party.name),
            excluded: true,
            reason: `No alcanza el 3% mínimo`
          }))
        ].sort((a, b) => b.votes - a.votes);

        return {
          results,
          totalSeats,
          totalVotes,
          level: 'Provincial',
          locationName: result.provincia,
          threshold: 3.0
        };
      }
    }

    // Autonomous community level
    if (autonomousResults && autonomousResults.length > 0) {
      const targetCA = filters?.autonomousCommunity;
      const result = targetCA 
        ? autonomousResults.find(r => r.comunidadAutonoma === targetCA)
        : autonomousResults[0];
      
      if (result) {
        const totalVotes = result.totalVotes;
        const totalSeats = result.totalSeats;
        
        const results: PartyResult[] = result.parties.map(party => ({
          party: party.name,
          votes: party.votes,
          percentage: (party.votes / totalVotes) * 100,
          seats: party.seats,
          color: getPartyColor(party.name)
        })).sort((a, b) => b.votes - a.votes);

        return {
          results,
          totalSeats,
          totalVotes,
          level: 'Autonómico',
          locationName: result.comunidadAutonoma,
          threshold: 3.0 // Default threshold for autonomous communities
        };
      }
    }

    return null;
  };

  const data = processResultsData();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay datos de escaños disponibles para los filtros seleccionados.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Asegúrate de que hay escaños configurados para esta elección y nivel geográfico.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { results, totalSeats, totalVotes, level, locationName, threshold } = data;
  const partiesWithSeats = results.filter(r => r.seats > 0);
  const excludedParties = results.filter(r => r.excluded);

  // Prepare chart data
  const chartData = partiesWithSeats.map(party => ({
    party: party.party,
    seats: party.seats,
    fill: party.color
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title} - {level}</span>
          <Badge variant="outline">{locationName}</Badge>
        </CardTitle>
        {totalVotes > 0 && (
          <p className="text-sm text-muted-foreground">
            Total de votos: {totalVotes.toLocaleString()} | Umbral mínimo: {threshold}%
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Seats Chart */}
        {partiesWithSeats.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Distribución de Escaños ({totalSeats} total)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="party" type="category" width={80} />
                  <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="space-y-4">
          <h4 className="font-medium">Resultados Detallados</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                {totalVotes > 0 && <TableHead className="text-right">Votos</TableHead>}
                {totalVotes > 0 && <TableHead className="text-right">%</TableHead>}
                <TableHead className="text-right">Escaños</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((party) => (
                <TableRow key={party.party}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: party.color }}
                      />
                      {party.party}
                    </div>
                  </TableCell>
                  {totalVotes > 0 && (
                    <TableCell className="text-right">
                      {party.votes.toLocaleString()}
                    </TableCell>
                  )}
                  {totalVotes > 0 && (
                    <TableCell className="text-right">
                      {party.percentage.toFixed(2)}%
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">
                    {party.seats}
                  </TableCell>
                  <TableCell>
                    {party.excluded ? (
                      <Badge variant="destructive" className="text-xs">
                        Excluido
                      </Badge>
                    ) : party.seats > 0 ? (
                      <Badge variant="default" className="text-xs">
                        Con representación
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Sin escaños
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Excluded Parties Info */}
        {excludedParties.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-destructive">
              Partidos Excluidos ({excludedParties.length})
            </h4>
            <p className="text-sm text-muted-foreground">
              Los siguientes partidos no obtienen representación por no alcanzar el umbral mínimo del {threshold}%:
            </p>
            <div className="flex flex-wrap gap-2">
              {excludedParties.map((party) => (
                <Badge key={party.party} variant="outline" className="text-xs">
                  {party.party} ({party.percentage.toFixed(1)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Total Escaños</p>
              <p className="text-2xl font-bold text-primary">{totalSeats}</p>
            </div>
            {totalVotes > 0 && (
              <div>
                <p className="font-medium">Total Votos</p>
                <p className="text-2xl font-bold text-primary">{totalVotes.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="font-medium">Partidos con Escaños</p>
              <p className="text-2xl font-bold text-primary">{partiesWithSeats.length}</p>
            </div>
            <div>
              <p className="font-medium">Umbral Aplicado</p>
              <p className="text-2xl font-bold text-primary">{threshold}%</p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};