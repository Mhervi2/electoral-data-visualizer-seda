import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ElectoralActAdmin } from '@/hooks/useElectoralActsAdmin';

interface DuplicateGroup {
  full_identifier: string;
  acts: ElectoralActAdmin[];
  count: number;
}

interface DuplicateActsListProps {
  onEditAct: (act: ElectoralActAdmin) => void;
}

export const DuplicateActsList = ({ onEditAct }: DuplicateActsListProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const findDuplicateActs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('electoral_acts')
        .select(`
          *,
          mpca(
            municipio,
            provincia,
            ca
          ),
          party_votes:party_votes(
            id,
            votes,
            party_id,
            political_parties:political_parties(name, siglas, color)
          ),
          mail_votes:mail_votes(dni)
        `)
        .not('full_identifier', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching acts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las actas."
        });
        return;
      }

      // Map the data to include municipality information
      const mappedData = (data || []).map(act => ({
        ...act,
        municipio: act.mpca?.municipio || 'Sin municipio',
        provincia: act.mpca?.provincia || 'Sin provincia',
        comunidad_autonoma: act.mpca?.ca || 'Sin comunidad autónoma'
      }));

      // Group by full_identifier
      const groupedByIdentifier = mappedData.reduce((acc, act) => {
        const identifier = act.full_identifier;
        if (!identifier) return acc;
        
        if (!acc[identifier]) {
          acc[identifier] = [];
        }
        acc[identifier].push(act);
        return acc;
      }, {} as Record<string, ElectoralActAdmin[]>);

      // Filter only groups with more than one act (duplicates)
      const duplicates = Object.entries(groupedByIdentifier)
        .filter(([_, acts]) => acts.length > 1)
        .map(([identifier, acts]) => ({
          full_identifier: identifier,
          acts: acts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          count: acts.length
        }))
        .sort((a, b) => b.count - a.count);

      setDuplicateGroups(duplicates);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al buscar actas duplicadas."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findDuplicateActs();
  }, []);

  const getStatusBadge = (act: ElectoralActAdmin) => {
    if (act.version > 1) {
      return <Badge variant="secondary">Modificada v{act.version}</Badge>;
    }
    return <Badge variant="outline">Original</Badge>;
  };

  const getSourceBadge = (sourceType: string) => {
    const variants = {
      user: { variant: 'default' as const, label: 'Usuario' },
      mpca: { variant: 'secondary' as const, label: 'MPCA' },
      real_data: { variant: 'outline' as const, label: 'Datos Reales' }
    };
    
    const config = variants[sourceType as keyof typeof variants] || variants.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (duplicateGroups.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron actas duplicadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Actas Duplicadas ({duplicateGroups.reduce((acc, group) => acc + group.count, 0)} actas en {duplicateGroups.length} grupos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {duplicateGroups.map((group) => (
              <div key={group.full_identifier} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    Identificador: {group.full_identifier}
                  </h3>
                  <Badge variant="destructive">
                    {group.count} duplicados
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Municipio</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Censo</TableHead>
                      <TableHead>Votantes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.acts.map((act, index) => (
                      <TableRow 
                        key={act.id} 
                        className={index === 0 ? 'bg-muted/50' : ''}
                      >
                        <TableCell>{act.municipio}</TableCell>
                        <TableCell>{getSourceBadge(act.source_type)}</TableCell>
                        <TableCell>{act.census_total}</TableCell>
                        <TableCell>{act.total_voters}</TableCell>
                        <TableCell>{getStatusBadge(act)}</TableCell>
                        <TableCell>
                          {format(new Date(act.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditAct(act)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};