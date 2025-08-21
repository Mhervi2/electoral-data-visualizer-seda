
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

interface ElectoralChartsProps {
  partyResults: PartyResultBySource[];
  totalVotes: number;
  totalCensus: number;
  abstention: number;
  selectedSources: string[];
}

export const ElectoralCharts = ({ partyResults, totalVotes, totalCensus, abstention, selectedSources }: ElectoralChartsProps) => {
  if (!partyResults || partyResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución Porcentual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de partidos para mostrar en el gráfico.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSourceDisplayName = (sourceType: string) => {
    const displayNames: { [key: string]: string } = {
      'user': 'Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio',
      'oficial': 'Oficial'
    };
    return displayNames[sourceType] || sourceType;
  };

  const createPieChartData = (sourceType: string) => {
    const partyData = partyResults
      .map(result => ({
        name: result.party.siglas,
        fullName: result.party.name,
        value: result.sourceResults[sourceType]?.votes || 0,
        fill: result.party.color || '#6B7280',
        percentage: result.sourceResults[sourceType]?.percentage || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Limit to top 10 parties per chart

    // Calculate abstention for this source
    const sourceActs = partyResults.length > 0 ? 
      // We need to calculate source-specific abstention
      // For now, distribute abstention proportionally
      Math.round(abstention * (partyData.reduce((sum, p) => sum + p.value, 0) / totalVotes)) : 0;
    
    // Add abstention to the chart data
    if (sourceActs > 0) {
      partyData.push({
        name: 'ABST',
        fullName: 'Abstención',
        value: sourceActs,
        fill: '#94a3b8', // Gray color for abstention
        percentage: totalCensus > 0 ? (sourceActs / totalCensus) * 100 : 0
      });
    }

    return partyData;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-gray-600 text-xs">{data.fullName}</p>
          <p className="text-blue-600">
            <span className="font-medium">Votos:</span> {data.value.toLocaleString()}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Porcentaje:</span> {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine grid layout based on number of sources
  const getGridCols = () => {
    if (selectedSources.length === 1) return 'grid-cols-1';
    if (selectedSources.length === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución Porcentual por Fuente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${getGridCols()} gap-6`}>
          {selectedSources.map(sourceType => {
            const pieChartData = createPieChartData(sourceType);
            const sourceDisplayName = getSourceDisplayName(sourceType);
            const tooltipText = getSourceTooltip(sourceType);
            
            if (pieChartData.length === 0) {
              return (
                <div key={sourceType} className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">{sourceDisplayName}</h3>
                  {tooltipText && (
                    <p className="text-xs text-muted-foreground mb-4">{tooltipText}</p>
                  )}
                  <p className="text-muted-foreground">Sin datos disponibles</p>
                </div>
              );
            }

            return (
              <div key={sourceType} className="text-center">
                <h3 className="text-lg font-semibold mb-2">{sourceDisplayName}</h3>
                {tooltipText && (
                  <p className="text-xs text-muted-foreground mb-4">{tooltipText}</p>
                )}
                
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
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
                      <span className="text-gray-500">({entry.percentage.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
