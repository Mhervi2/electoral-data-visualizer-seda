import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface DHondtChartsProps {
  provincialResults?: ProvincialResult[];
  autonomousResults?: AutonomousResult[];
  title: string;
  maxColumnsPerRow?: number;
}

export const DHondtCharts = ({ provincialResults, autonomousResults, title, maxColumnsPerRow = 3 }: DHondtChartsProps) => {
  if (!provincialResults && !autonomousResults) {
    return null;
  }

  // Party colors mapping - use consistent colors for parties
  const getPartyColor = (partyName: string) => {
    const colors: { [key: string]: string } = {
      'PP': 'hsl(210, 100%, 45%)', // Blue
      'PSOE': 'hsl(0, 85%, 50%)', // Red  
      'VOX': 'hsl(120, 60%, 35%)', // Green
      'UP': 'hsl(270, 60%, 50%)', // Purple
      'CS': 'hsl(30, 85%, 55%)', // Orange
      'ERC': 'hsl(45, 90%, 50%)', // Yellow
      'JxCAT': 'hsl(180, 60%, 45%)', // Teal
      'PNV': 'hsl(100, 40%, 45%)', // Olive
      'EH': 'hsl(15, 70%, 50%)', // Red-orange
      'CUP': 'hsl(340, 70%, 50%)', // Pink
      'MP': 'hsl(280, 50%, 45%)', // Magenta
      'CC': 'hsl(200, 60%, 40%)', // Light blue
      'PRC': 'hsl(160, 50%, 40%)', // Sea green
    };
    
    // Default colors for unknown parties
    const defaultColors = [
      'hsl(220, 70%, 60%)',
      'hsl(150, 60%, 50%)',
      'hsl(280, 60%, 60%)',
      'hsl(30, 70%, 55%)',
      'hsl(350, 60%, 55%)',
      'hsl(190, 60%, 50%)',
      'hsl(60, 60%, 50%)',
      'hsl(300, 50%, 55%)',
    ];
    
    return colors[partyName] || defaultColors[partyName.length % defaultColors.length];
  };

  const createPieChartData = (parties: any[], totalSeats: number) => {
    return parties
      .filter(party => party.seats > 0)
      .map(party => ({
        name: party.name,
        value: party.seats,
        fill: getPartyColor(party.name),
        percentage: ((party.seats / totalSeats) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">Escaños:</span> {data.value}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Porcentaje:</span> {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const getGridCols = (resultsLength: number) => {
    if (resultsLength === 1) return 'grid-cols-1';
    if (resultsLength === 2) return 'grid-cols-1 md:grid-cols-2';
    if (resultsLength === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (resultsLength === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (maxColumnsPerRow >= 5) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {provincialResults && (
          <div className={`grid ${getGridCols(provincialResults.length)} gap-6`}>
            {provincialResults.map((result) => {
              const pieChartData = createPieChartData(result.parties, result.totalSeats);
              
              if (pieChartData.length === 0) {
                return (
                  <div key={result.provincia} className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-2">{result.provincia}</h3>
                    <p className="text-muted-foreground">Sin escaños asignados</p>
                  </div>
                );
              }

              return (
                <div key={result.provincia} className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {result.provincia} ({result.totalSeats} escaños)
                  </h3>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {pieChartData.slice(0, 6).map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1 text-xs">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-gray-700 font-medium">{entry.name}</span>
                        <span className="text-gray-500">({entry.percentage}%)</span>
                      </div>
                    ))}
                  </div>

                  {result.excludedParties && result.excludedParties.length > 0 && (
                    <div className="mt-6 p-4 bg-destructive/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">
                          Sin representación (no alcanzan umbral mínimo)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.excludedParties.map((party, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{party.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {party.votes.toLocaleString()} votos
                              </span>
                              <Badge variant="outline" className="text-destructive border-destructive">
                                {party.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {autonomousResults && (
          <div className={`grid ${getGridCols(autonomousResults.length)} gap-6`}>
            {autonomousResults.map((result) => {
              const pieChartData = createPieChartData(result.parties, result.totalSeats);
              
              if (pieChartData.length === 0) {
                return (
                  <div key={result.comunidadAutonoma} className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-2">{result.comunidadAutonoma}</h3>
                    <p className="text-muted-foreground">Sin escaños asignados</p>
                  </div>
                );
              }

              return (
                <div key={result.comunidadAutonoma} className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {result.comunidadAutonoma} ({result.totalSeats} escaños)
                  </h3>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}`}
                          labelLine={false}
                          fontSize={10}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {pieChartData.slice(0, 6).map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1 text-xs">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="text-gray-700 font-medium">{entry.name}</span>
                        <span className="text-gray-500">({entry.percentage}%)</span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};