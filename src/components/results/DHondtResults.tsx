import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { calculateDHondt, PartyVotes, DHondtResult } from '@/utils/dhondt';
import { useProvincialSeats } from '@/hooks/useProvincialSeats';

// Definimos el tipo localmente
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

interface DHondtResultsProps {
  partyResults: PartyResultBySource[];
  totalVotes: number;
  filters: {
    electionId: string;
    autonomousCommunity: string;
    province: string;
    municipality: string;
    sourceTypes: string[];
  };
}

interface ProvincialDHondtResult {
  provincia: string;
  seats: number;
  threshold: number;
  sourceResults: {
    [source: string]: {
      dhondtResults: DHondtResult[];
      excludedParties: DHondtResult[];
      totalVotes: number;
      validVotes: number;
    };
  };
}

// Mapeo de provincias a comunidades autónomas
const PROVINCE_TO_CA: { [key: string]: string } = {
  'Álava': 'País Vasco', 'Albacete': 'Castilla-La Mancha', 'Alicante': 'Comunitat Valenciana',
  'Almería': 'Andalucía', 'Asturias': 'Asturias', 'Ávila': 'Castilla y León',
  'Badajoz': 'Extremadura', 'Baleares': 'Baleares', 'Barcelona': 'Cataluña',
  'Burgos': 'Castilla y León', 'Cáceres': 'Extremadura', 'Cádiz': 'Andalucía',
  'Cantabria': 'Cantabria', 'Castellón': 'Comunitat Valenciana', 'Ciudad Real': 'Castilla-La Mancha',
  'Córdoba': 'Andalucía', 'La Coruña': 'Galicia', 'Cuenca': 'Castilla-La Mancha',
  'Girona': 'Cataluña', 'Granada': 'Andalucía', 'Guadalajara': 'Castilla-La Mancha',
  'Gipuzkoa': 'País Vasco', 'Huelva': 'Andalucía', 'Huesca': 'Aragón',
  'Jaén': 'Andalucía', 'León': 'Castilla y León', 'Lleida': 'Cataluña',
  'La Rioja': 'La Rioja', 'Lugo': 'Galicia', 'Madrid': 'Madrid',
  'Málaga': 'Andalucía', 'Murcia': 'Murcia', 'Navarra': 'Navarra',
  'Ourense': 'Galicia', 'Palencia': 'Castilla y León', 'Las Palmas': 'Canarias',
  'Pontevedra': 'Galicia', 'Salamanca': 'Castilla y León', 'Santa Cruz de Tenerife': 'Canarias',
  'Segovia': 'Castilla y León', 'Sevilla': 'Andalucía', 'Soria': 'Castilla y León',
  'Tarragona': 'Cataluña', 'Teruel': 'Aragón', 'Toledo': 'Castilla-La Mancha',
  'Valencia': 'Comunitat Valenciana', 'Valladolid': 'Castilla y León', 'Vizcaya': 'País Vasco',
  'Zamora': 'Castilla y León', 'Zaragoza': 'Aragón', 'Ceuta': 'Ceuta', 'Melilla': 'Melilla'
};

const getPartyColor = (partyName: string): string => {
  const colorMap: { [key: string]: string } = {
    'PP': 'hsl(213, 100%, 40%)',
    'PSOE': 'hsl(0, 100%, 50%)',
    'VOX': 'hsl(120, 100%, 40%)',
    'SUMAR': 'hsl(280, 100%, 40%)',
    'ERC': 'hsl(45, 100%, 50%)',
    'JUNTS': 'hsl(200, 60%, 60%)',
    'PNV': 'hsl(120, 100%, 25%)',
    'BILDU': 'hsl(25, 50%, 30%)',
    'BNG': 'hsl(200, 60%, 60%)',
    'CC': 'hsl(60, 100%, 50%)',
    'UPN': 'hsl(240, 100%, 25%)'
  };
  return colorMap[partyName] || `hsl(${Math.abs(partyName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`;
};

// Helper function to normalize strings for comparison (handles accents, case, and whitespace)
const normalizeString = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Escaños: <span className="font-medium text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Votos: <span className="font-medium text-foreground">{data.votes?.toLocaleString()}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Porcentaje: <span className="font-medium text-foreground">{data.percentage?.toFixed(2)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const DHondtResults = ({ partyResults, totalVotes, filters }: DHondtResultsProps) => {
  const { provincialSeats } = useProvincialSeats(filters.electionId);
  const THRESHOLD_PERCENTAGE = 3.0; // Umbral mínimo del 3%

  const provincialResults = useMemo(() => {
    // Validaciones iniciales
    if (!partyResults.length) {
      console.log('[DHondt] No hay resultados de partidos disponibles');
      return [];
    }
    
    if (!provincialSeats.length) {
      console.log('[DHondt] No hay datos de escaños provinciales configurados');
      return [];
    }

    console.log('[DHondt] Filtros actuales:', filters);
    console.log('[DHondt] Escaños provinciales disponibles:', provincialSeats.map(s => s.provincia));
    console.log('[DHondt] Resultados de partidos:', partyResults.length);

    // Determinar qué provincias procesar según los filtros
    let targetProvinces: string[] = [];
    
    if (filters.province) {
      // Filtro específico por provincia
      console.log('[DHondt] Filtro por provincia específica:', filters.province);
      
      // Buscar la provincia exacta o por coincidencia parcial (con normalización de acentos)
      const normalizedProvince = normalizeString(filters.province);
      console.log('[DHondt] Provincia filtrada normalizada:', filters.province, '->', normalizedProvince);
      
      const exactMatch = provincialSeats.find(seat => {
        const normalized = normalizeString(seat.provincia);
        console.log('[DHondt] Comparando:', seat.provincia, '->', normalized, 'con', normalizedProvince);
        return normalized === normalizedProvince;
      });
      
      if (exactMatch) {
        targetProvinces = [exactMatch.provincia];
        console.log('[DHondt] Provincia encontrada (coincidencia exacta):', exactMatch.provincia);
      } else {
        // Buscar coincidencia parcial (con normalización de acentos)
        const partialMatch = provincialSeats.find(seat => {
          const normalized = normalizeString(seat.provincia);
          return normalized.includes(normalizedProvince) || normalizedProvince.includes(normalized);
        });
        
        if (partialMatch) {
          targetProvinces = [partialMatch.provincia];
          console.log('[DHondt] Provincia encontrada (coincidencia parcial):', partialMatch.provincia);
        } else {
          console.log('[DHondt] No se encontró la provincia:', filters.province);
          console.log('[DHondt] Provincias disponibles:', provincialSeats.map(s => s.provincia));
          return [];
        }
      }
    } else if (filters.autonomousCommunity) {
      // Filtro por comunidad autónoma
      console.log('[DHondt] Filtro por comunidad autónoma:', filters.autonomousCommunity);
      
      targetProvinces = provincialSeats
        .filter(seat => PROVINCE_TO_CA[seat.provincia] === filters.autonomousCommunity)
        .map(seat => seat.provincia);
        
      console.log('[DHondt] Provincias de la CA encontradas:', targetProvinces);
    } else {
      // Sin filtro geográfico - mostrar todas las provincias
      targetProvinces = provincialSeats.map(seat => seat.provincia);
      console.log('[DHondt] Sin filtro - mostrando todas las provincias:', targetProvinces.length);
    }

    if (targetProvinces.length === 0) {
      console.log('[DHondt] No hay provincias objetivo para procesar');
      return [];
    }

    // Procesar cada provincia objetivo
    const results = targetProvinces.map(provincia => {
      console.log(`[DHondt] Procesando provincia: ${provincia}`);
      
      const provincialSeat = provincialSeats.find(seat => seat.provincia === provincia);
      if (!provincialSeat) {
        console.log(`[DHondt] No se encontraron escaños para ${provincia}`);
        return null;
      }

      console.log(`[DHondt] ${provincia} tiene ${provincialSeat.seats} escaños`);

      const sourceResults: { [source: string]: any } = {};
      
      // Procesar cada tipo de fuente de datos
      filters.sourceTypes.forEach(sourceType => {
        console.log(`[DHondt] Procesando fuente ${sourceType} para ${provincia}`);
        
        // Extraer votos de esta fuente para todos los partidos
        const sourceVotes = partyResults
          .map(party => {
            const votes = party.sourceResults[sourceType]?.votes || 0;
            return {
              name: party.party.siglas || party.party.name,
              votes: votes
            };
          })
          .filter(party => party.votes > 0);

        console.log(`[DHondt] ${sourceType} - ${provincia}: ${sourceVotes.length} partidos con votos`);

        const sourceTotal = sourceVotes.reduce((sum, party) => sum + party.votes, 0);
        console.log(`[DHondt] ${sourceType} - ${provincia}: Total de votos = ${sourceTotal}`);
        
        if (sourceTotal === 0) {
          console.log(`[DHondt] ${sourceType} - ${provincia}: No hay votos, creando resultado vacío`);
          sourceResults[sourceType] = {
            dhondtResults: [],
            excludedParties: [],
            totalVotes: 0,
            validVotes: 0
          };
          return;
        }

        // Aplicar umbral del 3%
        const partiesOverThreshold = sourceVotes.filter(
          party => (party.votes / sourceTotal) * 100 >= THRESHOLD_PERCENTAGE
        );
        const partiesUnderThreshold = sourceVotes.filter(
          party => (party.votes / sourceTotal) * 100 < THRESHOLD_PERCENTAGE
        );

        console.log(`[DHondt] ${sourceType} - ${provincia}: ${partiesOverThreshold.length} partidos superan umbral, ${partiesUnderThreshold.length} no`);

        // Calcular D'Hondt solo para partidos que superan el umbral
        let dhondtResults: DHondtResult[] = [];
        if (partiesOverThreshold.length > 0) {
          dhondtResults = calculateDHondt(partiesOverThreshold, provincialSeat.seats);
          console.log(`[DHondt] ${sourceType} - ${provincia}: Calculados ${dhondtResults.length} resultados D'Hondt`);
        }
        
        // Enriquecer resultados con información adicional
        const enrichedResults = dhondtResults.map(result => ({
          ...result,
          percentage: (result.votes / sourceTotal) * 100
        }));

        const enrichedExcluded = partiesUnderThreshold.map(party => ({
          ...party,
          seats: 0,
          quotients: [],
          percentage: (party.votes / sourceTotal) * 100
        }));

        sourceResults[sourceType] = {
          dhondtResults: enrichedResults,
          excludedParties: enrichedExcluded,
          totalVotes: sourceTotal,
          validVotes: sourceTotal
        };
      });

      const result = {
        provincia,
        seats: provincialSeat.seats,
        threshold: THRESHOLD_PERCENTAGE,
        sourceResults
      };

      console.log(`[DHondt] Resultado final para ${provincia}:`, {
        seats: result.seats,
        sources: Object.keys(result.sourceResults)
      });

      return result;
    }).filter(Boolean) as ProvincialDHondtResult[];

    console.log(`[DHondt] Devolviendo ${results.length} resultados provinciales`);
    return results;
  }, [partyResults, provincialSeats, filters]);

  const renderSemicircleChart = (dhondtResults: DHondtResult[], totalSeats: number, sourceType: string) => {
    if (!dhondtResults.length) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No hay datos de escaños para {sourceType}</p>
        </div>
      );
    }

    // Preparar datos para el gráfico semicircular
    const chartData = dhondtResults
      .filter(party => party.seats > 0)
      .map(party => ({
        name: party.name,
        value: party.seats,
        votes: party.votes,
        percentage: (party as any).percentage,
        fill: getPartyColor(party.name)
      }));

    // Agregar escaños vacíos si los hay
    const assignedSeats = chartData.reduce((sum, party) => sum + party.value, 0);
    if (assignedSeats < totalSeats) {
      chartData.push({
        name: 'Vacíos',
        value: totalSeats - assignedSeats,
        votes: 0,
        percentage: 0,
        fill: 'hsl(var(--muted))'
      });
    }

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={120}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload?.value} escaños)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderProvincialResults = (provincial: ProvincialDHondtResult) => (
    <Card key={provincial.provincia} className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{provincial.provincia}</span>
          <Badge variant="outline">{provincial.seats} escaños</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Umbral mínimo: {provincial.threshold}% de los votos válidos
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={filters.sourceTypes[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {filters.sourceTypes.map(source => (
              <TabsTrigger key={source} value={source} className="text-xs">
                {source === 'user' ? 'Usuario' : 
                 source === 'indra' ? 'INDRA' : 
                 source === 'escrutinio' ? 'Escrutinio' : 'Oficial'}
              </TabsTrigger>
            ))}
          </TabsList>

          {filters.sourceTypes.map(source => {
            const sourceData = provincial.sourceResults[source];
            if (!sourceData) return null;

            return (
              <TabsContent key={source} value={source} className="space-y-6">
                {/* Gráfico semicircular */}
                <div className="space-y-4">
                  <h4 className="font-medium text-center">
                    Distribución de Escaños - {source.charAt(0).toUpperCase() + source.slice(1)}
                  </h4>
                  {renderSemicircleChart(sourceData.dhondtResults, provincial.seats, source)}
                </div>

                <Separator />

                {/* Tabla de resultados */}
                <div className="space-y-4">
                  <h4 className="font-medium">Resultados Detallados</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partido</TableHead>
                        <TableHead className="text-right">Votos</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Escaños</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourceData.dhondtResults.map((party: any) => (
                        <TableRow key={`${party.name}-included`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getPartyColor(party.name) }}
                              />
                              {party.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {party.votes.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {party.percentage.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {party.seats}
                          </TableCell>
                          <TableCell>
                            {party.seats > 0 ? (
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
                      {sourceData.excludedParties.map((party: any) => (
                        <TableRow key={`${party.name}-excluded`} className="opacity-60">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getPartyColor(party.name) }}
                              />
                              {party.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {party.votes.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {party.percentage.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-medium">0</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              No supera umbral
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Métricas de resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Escaños</p>
                    <p className="text-2xl font-bold text-primary">{provincial.seats}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Votos Válidos</p>
                    <p className="text-2xl font-bold text-primary">
                      {sourceData.validVotes.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Partidos con Escaños</p>
                    <p className="text-2xl font-bold text-primary">
                      {sourceData.dhondtResults.filter((p: any) => p.seats > 0).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Umbral Mínimo</p>
                    <p className="text-2xl font-bold text-primary">{provincial.threshold}%</p>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );

  if (!provincialResults.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Escaños (Método D'Hondt)</CardTitle>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Escaños (Método D'Hondt)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reparto de escaños aplicando la Ley D'Hondt con umbral mínimo del {THRESHOLD_PERCENTAGE}%
            {filters.province && ` para la provincia de ${filters.province}`}
            {!filters.province && filters.autonomousCommunity && ` para ${filters.autonomousCommunity}`}
          </p>
          {filters.province && (
            <Badge variant="secondary" className="w-fit">
              Filtrado por: {filters.province}
            </Badge>
          )}
        </CardHeader>
      </Card>

      {provincialResults.map(renderProvincialResults)}
    </div>
  );
};