import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProvincialResult, AutonomousResult } from '@/utils/dhondtCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { DHondtCharts } from './DHondtCharts';

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
    <DHondtCharts 
      provincialResults={provincialResults}
      autonomousResults={autonomousResults}
      title={title}
    />
  );
};