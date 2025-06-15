
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
    fill: result.party.color
  }));

  const pieChartData = topParties.map(result => ({
    name: result.party.siglas,
    value: result.totalVotes,
    fill: result.party.color
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados por Partido (Votos)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barChartData} 
                layout="horizontal" 
                margin={{ left: 60, right: 20, top: 20, bottom: 20 }}
              >
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => value.toLocaleString()}
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="party" 
                  width={55}
                  fontSize={12}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    `${value.toLocaleString()} votos (${((value / totalVotes) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Bar dataKey="votes" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Votos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: any) => [
                    `${value.toLocaleString()} votos`,
                    'Votos'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
