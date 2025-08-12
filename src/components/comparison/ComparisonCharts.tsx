import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PartyComparisonData, ElectionOption } from '@/hooks/useElectoralComparison';

interface ComparisonChartsProps {
  data: PartyComparisonData[];
  elections: ElectionOption[];
}

export const ComparisonCharts = ({ data, elections }: ComparisonChartsProps) => {
  // Transform data for recharts
  const chartData = data.map(party => {
    const result: any = {
      party_name: party.party_name.length > 15 
        ? party.party_name.substring(0, 15) + '...'
        : party.party_name,
      full_name: party.party_name
    };

    elections.forEach(election => {
      const electionData = party.elections[election.id];
      result[`percentage_${election.id}`] = electionData?.percentage || 0;
      result[`votes_${election.id}`] = electionData?.votes || 0;
    });

    return result;
  });

  // Generate colors for each election
  const electionColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.full_name}</p>
          {elections.map((election, index) => {
            const percentage = data[`percentage_${election.id}`];
            const votes = data[`votes_${election.id}`];
            if (percentage > 0) {
              return (
                <p key={election.id} className="text-sm">
                  <span style={{ color: electionColors[index] }}>
                    {election.name}:
                  </span>
                  {' '}
                  {percentage.toFixed(2)}% ({votes.toLocaleString()} votos)
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Porcentajes de Voto por Partido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="party_name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {elections.map((election, index) => (
                  <Bar
                    key={election.id}
                    dataKey={`percentage_${election.id}`}
                    name={election.name}
                    fill={electionColors[index]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Partido</th>
                  {elections.map(election => (
                    <th key={election.id} className="text-center p-2 font-medium">
                      {election.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(party => (
                  <tr key={party.party_id} className="border-b hover:bg-accent/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: party.party_color }}
                        />
                        {party.party_name}
                      </div>
                    </td>
                    {elections.map(election => {
                      const electionData = party.elections[election.id];
                      return (
                        <td key={election.id} className="text-center p-2">
                          {electionData ? (
                            <div>
                              <div className="font-medium">
                                {electionData.percentage.toFixed(2)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {electionData.votes.toLocaleString()} votos
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};