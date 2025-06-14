import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiscrepancyData {
  municipality: string;
  district: string;
  section: string;
  table_letter: string;
  acts: {
    source_type: string;
    census_total: number;
    total_voters: number;
    blank_votes: number;
    null_votes: number;
    party_votes: { [party: string]: number };
  }[];
  differences: string[];
}

const DiscrepancyDetector = () => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectDiscrepancies();
  }, []);

  const detectDiscrepancies = async () => {
    try {
      console.log('Detecting discrepancies...');
      
      // Get all electoral acts using the new view
      const { data: acts, error } = await supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          *,
          party_votes (
            votes,
            political_parties (siglas)
          )
        `);

      if (error) throw error;

      // Group acts by location (municipality, district, section, table)
      const groupedActs = new Map<string, any[]>();
      
      acts?.forEach(act => {
        const key = `${act.municipality_idm}-${act.district}-${act.section}-${act.table_letter}`;
        if (!groupedActs.has(key)) {
          groupedActs.set(key, []);
        }
        groupedActs.get(key)?.push(act);
      });

      const foundDiscrepancies: DiscrepancyData[] = [];

      // Check for discrepancies in each group
      groupedActs.forEach((locationActs, key) => {
        if (locationActs.length > 1) {
          const differences: string[] = [];
          const firstAct = locationActs[0];
          
          for (let i = 1; i < locationActs.length; i++) {
            const compareAct = locationActs[i];
            
            // Compare basic data
            if (firstAct.census_total !== compareAct.census_total) {
              differences.push(`Censo: ${firstAct.source_type}: ${firstAct.census_total}, ${compareAct.source_type}: ${compareAct.census_total}`);
            }
            
            if (firstAct.total_voters !== compareAct.total_voters) {
              differences.push(`Votantes: ${firstAct.source_type}: ${firstAct.total_voters}, ${compareAct.source_type}: ${compareAct.total_voters}`);
            }
            
            if (firstAct.blank_votes !== compareAct.blank_votes) {
              differences.push(`Blancos: ${firstAct.source_type}: ${firstAct.blank_votes}, ${compareAct.source_type}: ${compareAct.blank_votes}`);
            }
            
            if (firstAct.null_votes !== compareAct.null_votes) {
              differences.push(`Nulos: ${firstAct.source_type}: ${firstAct.null_votes}, ${compareAct.source_type}: ${compareAct.null_votes}`);
            }
          }

          if (differences.length > 0) {
            foundDiscrepancies.push({
              municipality: firstAct.municipio || 'N/A',
              district: firstAct.district,
              section: firstAct.section,
              table_letter: firstAct.table_letter,
              acts: locationActs.map(act => ({
                source_type: act.source_type,
                census_total: act.census_total,
                total_voters: act.total_voters,
                blank_votes: act.blank_votes,
                null_votes: act.null_votes,
                party_votes: act.party_votes?.reduce((acc: any, pv: any) => {
                  acc[pv.political_parties?.siglas || 'N/A'] = pv.votes;
                  return acc;
                }, {}) || {}
              })),
              differences
            });
          }
        }
      });

      console.log('Discrepancies found:', foundDiscrepancies.length);
      setDiscrepancies(foundDiscrepancies);
    } catch (error) {
      console.error('Error detecting discrepancies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio',
      'oficial': 'Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const getSourceTypeBadgeVariant = (sourceType: string) => {
    const variants = {
      'user': 'default',
      'indra': 'secondary',
      'escrutinio': 'outline',
      'oficial': 'destructive'
    };
    return variants[sourceType as keyof typeof variants] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (discrepancies.length === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Sin Discrepancias
          </CardTitle>
          <CardDescription>
            No se han detectado discrepancias entre las diferentes fuentes de datos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
          Discrepancias Detectadas ({discrepancies.length})
        </CardTitle>
        <CardDescription>
          Actas donde los datos no coinciden entre diferentes fuentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ubicación</TableHead>
              <TableHead>Fuentes</TableHead>
              <TableHead>Diferencias Detectadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discrepancies.map((discrepancy, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{discrepancy.municipality}</div>
                    <div className="text-muted-foreground">
                      D:{discrepancy.district} S:{discrepancy.section} M:{discrepancy.table_letter}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {discrepancy.acts.map((act, actIndex) => (
                      <Badge 
                        key={actIndex} 
                        variant={getSourceTypeBadgeVariant(act.source_type) as any}
                      >
                        {getSourceTypeLabel(act.source_type)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-destructive">
                  <ul className="list-disc list-inside space-y-1">
                    {discrepancy.differences.map((diff, diffIndex) => (
                      <li key={diffIndex}>{diff}</li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DiscrepancyDetector;
