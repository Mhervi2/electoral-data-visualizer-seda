
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface DiscrepancyData {
  municipality: string;
  mesa_identifier: string;
  municipality_idm: number;
  acts: {
    source_type: string;
    census_total: number;
    total_voters: number;
    blank_votes: number;
    null_votes: number;
  }[];
  differences: string[];
}

interface DiscrepancyDetectorProps {
  onDiscrepancyClick?: (discrepancy: DiscrepancyData) => void;
}

const DiscrepancyDetector: React.FC<DiscrepancyDetectorProps> = ({ onDiscrepancyClick }) => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    detectDiscrepancies();
  }, []);

  const detectDiscrepancies = async () => {
    try {
      console.log('Detecting discrepancies...');
      setLoading(true);
      
      // Obtener todas las actas electorales
      const { data: acts, error } = await supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          id,
          municipality_idm,
          mesa_identifier,
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          source_type,
          municipio
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching acts for discrepancy detection:', error);
        setDiscrepancies([]);
        return;
      }

      console.log('Acts loaded for discrepancy detection:', acts?.length || 0);

      if (!acts || acts.length === 0) {
        console.log('No acts found, no discrepancies to detect');
        setDiscrepancies([]);
        return;
      }

      // Agrupar actas por ubicación (municipality, mesa_identifier)
      const groupedActs = new Map<string, any[]>();
      
      acts.forEach(act => {
        const key = `${act.municipality_idm || 'unknown'}-${act.mesa_identifier}`;
        if (!groupedActs.has(key)) {
          groupedActs.set(key, []);
        }
        groupedActs.get(key)?.push(act);
      });

      const foundDiscrepancies: DiscrepancyData[] = [];

      // Verificar discrepancias en cada grupo
      groupedActs.forEach((locationActs) => {
        if (locationActs.length > 1) {
          const differences: string[] = [];
          const firstAct = locationActs[0];
          
          for (let i = 1; i < locationActs.length; i++) {
            const compareAct = locationActs[i];
            
            // Comparar datos básicos
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
              mesa_identifier: firstAct.mesa_identifier,
              municipality_idm: firstAct.municipality_idm,
              acts: locationActs.map(act => ({
                source_type: act.source_type,
                census_total: act.census_total,
                total_voters: act.total_voters,
                blank_votes: act.blank_votes,
                null_votes: act.null_votes
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
      setDiscrepancies([]);
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

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const handleDiscrepancyClick = (discrepancy: DiscrepancyData) => {
    if (onDiscrepancyClick) {
      onDiscrepancyClick(discrepancy);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  // Filter discrepancies by municipality name
  const filteredDiscrepancies = discrepancies.filter(discrepancy =>
    discrepancy.municipality.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const displayedDiscrepancies = filteredDiscrepancies.slice(0, displayCount);

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
          Discrepancias Detectadas ({filteredDiscrepancies.length})
        </CardTitle>
        <CardDescription>
          Actas donde los datos no coinciden entre diferentes fuentes
        </CardDescription>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por municipio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
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
            {displayedDiscrepancies.map((discrepancy, index) => {
              const { district, section, table } = parseMesaIdentifier(discrepancy.mesa_identifier);
              return (
                <TableRow 
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleDiscrepancyClick(discrepancy)}
                >
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{discrepancy.municipality}</div>
                      <div className="text-muted-foreground">
                        Mesa: {discrepancy.mesa_identifier} (D:{district} S:{section} M:{table})
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
              );
            })}
          </TableBody>
        </Table>
        
        {displayCount < filteredDiscrepancies.length && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              className="w-full"
            >
              Ver más discrepancias ({filteredDiscrepancies.length - displayCount} restantes)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscrepancyDetector;
