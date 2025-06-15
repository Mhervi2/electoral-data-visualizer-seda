import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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
  // Prepare data for charts - take top 10 parties
  const topParties = partyResults.slice(0, 10);
  
  const chartConfig = topParties.reduce((config, result, index) => {
    config[result.party.siglas] = {
      label: result.party.name,
      color: result.party.color
    };
    return config;
  }, {} as any);

  const barChartData = topParties.map(result => ({
    party: result.party.siglas,
    votes: result.totalVotes,
    percentage: result.percentage,
    fill: result.party.color,
    name: result.party.name
  }));

  const pieChartData = topParties.map(result => ({
    name: result.party.siglas,
    value: result.totalVotes,
    fill: result.party.color
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">Votos:</span> {data.votes.toLocaleString()}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Porcentaje:</span> {data.percentage.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Votos por Partido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barChartData} 
                layout="horizontal" 
                margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
              >
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => value.toLocaleString()}
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="party" 
                  width={50}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#333', fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="votes" 
                  radius={[0, 4, 4, 0]}
                  stroke="none"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {barChartData.slice(0, 6).map((entry, index) => (
              <div key={entry.party} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-gray-700 font-medium">{entry.party}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución Porcentual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="45%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [
                    `${value.toLocaleString()} votos`,
                    'Votos'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieChartData.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-gray-700 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
