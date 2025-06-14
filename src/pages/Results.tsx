
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, Search, Eye, Image, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DiscrepancyDetector from '@/components/results/DiscrepancyDetector';

interface ElectoralAct {
  id: string;
  municipality_idm: number;
  district: string;
  section: string;
  table_letter: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
  party_votes?: { 
    party: { 
      name: string; 
      siglas: string; 
      color: string; 
    }; 
    votes: number; 
  }[];
}

interface Discrepancy {
  municipality: string;
  district: string;
  section: string;
  table_letter: string;
  sources: string[];
  differences: string[];
}

const Results = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [electoralActs, setElectoralActs] = useState<ElectoralAct[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    municipality: '',
    district: '',
    section: '',
    table: '',
    sourceType: 'all'
  });

  useEffect(() => {
    fetchElectoralActs();
    if (user?.isAdmin) {
      fetchDiscrepancies();
    }
  }, [user?.isAdmin]);

  // Separate useEffect for filters to avoid infinite loops
  useEffect(() => {
    if (!loading) {
      fetchElectoralActs();
    }
  }, [filters.municipality, filters.district, filters.section, filters.table, filters.sourceType]);

  const fetchElectoralActs = async () => {
    try {
      console.log('Fetching electoral acts with filters:', filters);
      setLoading(true);
      
      let query = supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          *,
          party_votes (
            votes,
            political_parties (
              name,
              siglas,
              color
            )
          )
        `);

      // Apply filters only if they have values
      if (filters.municipality.trim()) {
        query = query.ilike('municipio', `%${filters.municipality.trim()}%`);
      }
      
      if (filters.district.trim()) {
        query = query.eq('district', filters.district.trim());
      }
      if (filters.section.trim()) {
        query = query.eq('section', filters.section.trim());
      }
      if (filters.table.trim()) {
        query = query.eq('table_letter', filters.table.trim());
      }
      if (filters.sourceType.trim() && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching electoral acts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas electorales.",
        });
        setElectoralActs([]);
      } else {
        console.log('Electoral acts fetched:', data?.length || 0);
        
        // Transform the data to match the ElectoralAct interface with proper null handling
        const transformedData: ElectoralAct[] = data?.map(act => ({
          ...act,
          party_votes: act.party_votes?.map((pv: any) => ({
            party: pv.political_parties || { name: 'N/A', siglas: 'N/A', color: '#6B7280' },
            votes: pv.votes || 0
          })) || []
        })) || [];
        
        setElectoralActs(transformedData);
      }
    } catch (error) {
      console.error('Error fetching electoral acts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar las actas electorales.",
      });
      setElectoralActs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscrepancies = async () => {
    try {
      // This is a simplified mock for discrepancies
      // In a real implementation, you would query for actual discrepancies
      const mockDiscrepancies: Discrepancy[] = [
        {
          municipality: 'Madrid',
          district: '01',
          section: '001',
          table_letter: 'A',
          sources: ['indra', 'escrutinio'],
          differences: ['Total de votantes: INDRA: 745, Escrutinio: 747']
        }
      ];
      setDiscrepancies(mockDiscrepancies);
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Acta de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
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

  const getLocationDisplay = (act: ElectoralAct) => {
    const municipality = act.municipio || 'N/A';
    const province = act.provincia;
    const autonomousCommunity = act.comunidad_autonoma;
    
    let location = municipality;
    if (province && province !== municipality) {
      location += ` (${province})`;
    }
    if (autonomousCommunity) {
      location += ` - ${autonomousCommunity}`;
    }
    
    return location;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Resultados Electorales
          </h1>
          <p className="text-muted-foreground">
            Visualiza los resultados detallados por mesa electoral
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="municipality-filter">Municipio</Label>
              <Input
                id="municipality-filter"
                placeholder="Buscar municipio..."
                value={filters.municipality}
                onChange={(e) => setFilters(prev => ({ ...prev, municipality: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="district-filter">Distrito</Label>
              <Input
                id="district-filter"
                placeholder="Ej: 01"
                value={filters.district}
                onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="section-filter">Sección</Label>
              <Input
                id="section-filter"
                placeholder="Ej: 001"
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="table-filter">Mesa</Label>
              <Input
                id="table-filter"
                placeholder="Ej: A"
                value={filters.table}
                onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="source-filter">Fuente</Label>
              <Select value={filters.sourceType} onValueChange={(value) => setFilters(prev => ({ ...prev, sourceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las fuentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="user">Acta de Usuario</SelectItem>
                  <SelectItem value="indra">INDRA</SelectItem>
                  <SelectItem value="escrutinio">Escrutinio General</SelectItem>
                  <SelectItem value="oficial">Resultado Oficial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy Detection Section (Admin Only) */}
      {user?.isAdmin && (
        <DiscrepancyDetector />
      )}

      {/* Electoral Acts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Actas Electorales ({electoralActs.length})</CardTitle>
          <CardDescription>
            Resultados detallados por mesa electoral
          </CardDescription>
        </CardHeader>
        <CardContent>
          {electoralActs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron actas electorales que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Censo</TableHead>
                  <TableHead>Votantes</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {electoralActs.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getLocationDisplay(act)}</div>
                        <div className="text-muted-foreground">
                          D:{act.district} S:{act.section}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{act.table_letter}</TableCell>
                    <TableCell>{act.census_total}</TableCell>
                    <TableCell>{act.total_voters}</TableCell>
                    <TableCell>
                      <Badge variant={getSourceTypeBadgeVariant(act.source_type) as any}>
                        {getSourceTypeLabel(act.source_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(act.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {act.image_url && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Image className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Imagen del Acta</DialogTitle>
                                <DialogDescription>
                                  Mesa {act.table_letter} - {getLocationDisplay(act)} D:{act.district} S:{act.section}
                                </DialogDescription>
                              </DialogHeader>
                              <img 
                                src={act.image_url} 
                                alt="Acta electoral" 
                                className="w-full h-auto rounded-lg"
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
