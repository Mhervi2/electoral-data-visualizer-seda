import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';
import { DHondtCharts } from './DHondtCharts';

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

export const DHondtResults = ({ 
  provincialResults, 
  autonomousResults, 
  nationalSeats,
  title,
  filters
}: DHondtResultsProps) => {
  
  // Determine what to show based on filters
  const isNationalLevel = !filters?.autonomousCommunity && !filters?.province && !filters?.municipality;
  const isAutonomousLevel = filters?.autonomousCommunity && !filters?.province;
  const isProvincialLevel = filters?.province && !filters?.municipality;

  // National level: Show aggregated national pie chart
  if (isNationalLevel && nationalSeats && nationalSeats.length > 0) {
    const totalNationalSeats = nationalSeats.reduce((sum, party) => sum + party.seats, 0);
    const pieChartData = nationalSeats.map(party => ({
      name: party.party,
      value: party.seats,
      fill: party.color,
      percentage: ((party.seats / totalNationalSeats) * 100).toFixed(1)
    }));

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

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title} - Nacional ({totalNationalSeats} escaños)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="h-[400px] w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}
                    labelLine={false}
                    fontSize={12}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mt-6 max-w-2xl">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-muted-foreground">
                    {entry.value} escaños ({entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Autonomous or Provincial level: Show grid of charts
  if ((isAutonomousLevel || isProvincialLevel) && (provincialResults || autonomousResults)) {
    return (
      <DHondtCharts 
        provincialResults={provincialResults}
        autonomousResults={autonomousResults}
        title={title}
        maxColumnsPerRow={5}
      />
    );
  }

  return null;
};