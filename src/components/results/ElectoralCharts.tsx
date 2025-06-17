
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
}

export const ElectoralCharts = ({ partyResults, totalVotes }: ElectoralChartsProps) => {
  // Preparar datos para gráficos - tomar los primeros 10 partidos
  const topParties = partyResults.slice(0, 10);

  const pieChartData = topParties.map(result => ({
    name: result.party.siglas,
    fullName: result.party.name,
    value: result.totalVotes,
    fill: result.party.color || '#6B7280', // Color por defecto si no existe
    percentage: result.percentage
  }));

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

  if (pieChartData.length === 0) {
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

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribución Porcentual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {pieChartData.slice(0, 8).map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-gray-700 font-medium">{entry.name}</span>
                <span className="text-gray-500">({entry.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
