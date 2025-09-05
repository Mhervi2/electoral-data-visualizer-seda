import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, Image, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useElectoralAggregation } from '@/hooks/useElectoralAggregation';
import { ElectoralSummaryTable } from '@/components/results/ElectoralSummaryTable';
import { ResultsDetailsTable } from '@/components/results/ResultsDetailsTable';
import { ActDetailsDialog } from '@/components/results/ActDetailsDialog';
import { ElectoralActAdmin } from '@/hooks/useElectoralActsAdmin';

interface DiscrepancyData {
  municipality: string;
  mesa_identifier: string;
  municipality_idm: number;
  acts: {
    id: string;
    source_type: string;
    census_total: number;
    total_voters: number;
    blank_votes: number;
    null_votes: number;
    image_url?: string;
  }[];
  differences: string[];
}

interface AdminDiscrepancyDetectorProps {
  onEditAct: (act: ElectoralActAdmin) => void;
}

const AdminDiscrepancyDetector: React.FC<AdminDiscrepancyDetectorProps> = ({ onEditAct }) => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyData | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const {
    aggregatedResults,
    loading: aggregationLoading,
    setFilters,
    refetch
  } = useElectoralAggregation();

  useEffect(() => {
    detectDiscrepancies();
  }, []);

  const detectDiscrepancies = async () => {
    try {
      console.log('Detecting discrepancies...');
      setLoading(true);
      
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
          municipio,
          image_url
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching acts for discrepancy detection:', error);
        setDiscrepancies([]);
        return;
      }

      if (!acts || acts.length === 0) {
        setDiscrepancies([]);
        return;
      }

      // Group acts by location (municipality, mesa_identifier)
      const groupedActs = new Map<string, any[]>();
      
      acts.forEach(act => {
        const key = `${act.municipality_idm || 'unknown'}-${act.mesa_identifier}`;
        if (!groupedActs.has(key)) {
          groupedActs.set(key, []);
        }
        groupedActs.get(key)?.push(act);
      });

      const foundDiscrepancies: DiscrepancyData[] = [];

      // Check for discrepancies in each group
      groupedActs.forEach((locationActs) => {
        if (locationActs.length > 1) {
          const differences: string[] = [];
          const firstAct = locationActs[0];
          
          for (let i = 1; i < locationActs.length; i++) {
            const compareAct = locationActs[i];
            
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
                id: act.id,
                source_type: act.source_type,
                census_total: act.census_total,
                total_voters: act.total_voters,
                blank_votes: act.blank_votes,
                null_votes: act.null_votes,
                image_url: act.image_url
              })),
              differences
            });
          }
        }
      });

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
      return { district: '', section: '', table: '' };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const handleDiscrepancyClick = async (discrepancy: DiscrepancyData) => {
    setSelectedDiscrepancy(discrepancy);
    
    // Update filters to get aggregated data for this specific location
    setFilters({
      electionId: '',
      autonomousCommunity: '',
      province: '',
      municipality: discrepancy.municipality,
      district: '',
      section: '',
      table: '',
      sourceTypes: discrepancy.acts.map(act => act.source_type)
    });
    
    await refetch();
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const handleEditAct = async (actId: string) => {
    // Get the full act data for editing
    const { data: fullAct, error } = await supabase
      .from('electoral_acts')
      .select(`
        *,
        party_votes (
          party_id,
          votes,
          political_parties (
            id,
            name,
            siglas,
            color
          )
        ),
        mail_votes (
          dni
        )
      `)
      .eq('id', actId)
      .single();

    if (!error && fullAct) {
      // Convert to ElectoralActAdmin format
      const adminAct: ElectoralActAdmin = {
        id: fullAct.id,
        election_id: fullAct.election_id,
        municipality_idm: fullAct.municipality_idm,
        mesa_identifier: fullAct.mesa_identifier,
        census_total: fullAct.census_total,
        total_voters: fullAct.total_voters,
        blank_votes: fullAct.blank_votes,
        null_votes: fullAct.null_votes,
        source_type: fullAct.source_type,
        image_url: fullAct.image_url,
        created_at: fullAct.created_at,
        version: fullAct.version,
        updated_at: fullAct.updated_at,
        updated_by: fullAct.updated_by,
        observations: fullAct.observations,
        municipio: '',
        provincia: '',
        comunidad_autonoma: '',
        full_identifier: fullAct.full_identifier,
        party_votes: (fullAct.party_votes || []).map((pv: any) => ({
          id: pv.id || '',
          votes: pv.votes,
          party_id: pv.party_id,
          political_parties: {
            name: pv.political_parties?.name || '',
            siglas: pv.political_parties?.siglas || '',
            color: pv.political_parties?.color || '#6B7280'
          }
        })),
        mail_votes: fullAct.mail_votes || []
      };
      
      onEditAct(adminAct);
    }
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
    <div className="space-y-6">
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
                <TableHead className="text-right">Acciones</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        {discrepancy.acts.map((act, actIndex) => (
                          <div key={actIndex} className="flex gap-1">
                            {act.image_url && (
                              <ActDetailsDialog act={{
                                id: act.id,
                                image_url: act.image_url,
                                mesa_identifier: discrepancy.mesa_identifier,
                                municipality_idm: discrepancy.municipality_idm,
                                census_total: act.census_total,
                                total_voters: act.total_voters,
                                blank_votes: act.blank_votes,
                                null_votes: act.null_votes,
                                source_type: act.source_type,
                                created_at: '',
                                municipio: discrepancy.municipality,
                                provincia: '',
                                comunidad_autonoma: ''
                              }} />
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAct(act.id)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">{getSourceTypeLabel(act.source_type)}</span>
                            </Button>
                          </div>
                        ))}
                      </div>
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

      {/* Aggregated Data Display */}
      {selectedDiscrepancy && aggregatedResults && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Datos Agregados - {selectedDiscrepancy.municipality}, Mesa {selectedDiscrepancy.mesa_identifier}
            </h3>
            
            {aggregationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <ElectoralSummaryTable sourceMetrics={aggregatedResults.sourceMetrics} />
                <ResultsDetailsTable 
                  partyResults={aggregatedResults.partyResults}
                  totalVotes={aggregatedResults.totalVotes}
                  selectedSources={aggregatedResults.selectedSources}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscrepancyDetector;