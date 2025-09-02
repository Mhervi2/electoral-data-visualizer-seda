import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileX, Edit, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ElectoralActAdmin } from '@/hooks/useElectoralActsAdmin';

interface DuplicateGroup {
  full_identifier: string;
  acts: ElectoralActAdmin[];
}

interface DuplicateActsListProps {
  onEditAct: (act: ElectoralActAdmin) => void;
  onViewAudit: (act: ElectoralActAdmin) => Promise<void>;
}

export const DuplicateActsList = ({ onEditAct, onViewAudit }: DuplicateActsListProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDuplicates = async () => {
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
        .order('full_identifier', { ascending: true })
        .order('created_at', { ascending: true });

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

      // Group by full_identifier and filter duplicates
      const groupsMap = new Map<string, ElectoralActAdmin[]>();
      
      mappedData.forEach(act => {
        if (act.full_identifier) {
          if (!groupsMap.has(act.full_identifier)) {
            groupsMap.set(act.full_identifier, []);
          }
          groupsMap.get(act.full_identifier)!.push(act);
        }
      });

      // Only keep groups with more than one act (duplicates)
      const duplicates: DuplicateGroup[] = [];
      groupsMap.forEach((acts, full_identifier) => {
        if (acts.length > 1) {
          duplicates.push({ full_identifier, acts });
        }
      });

      setDuplicateGroups(duplicates);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al cargar las actas duplicadas."
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (act: ElectoralActAdmin) => {
    if (act.version > 1) {
      return <Badge variant="secondary">Modificada v{act.version}</Badge>;
    }
    return <Badge variant="outline">Original</Badge>;
  };

  const getSourceBadge = (sourceType: string) => {
    const variants = {
      'user': { variant: 'default' as const, label: 'Usuario' },
      'indra': { variant: 'secondary' as const, label: 'INDRA' },
      'escrutinio': { variant: 'outline' as const, label: 'Escrutinio' },
      'oficial': { variant: 'destructive' as const, label: 'Oficial' }
    };
    
    const config = variants[sourceType as keyof typeof variants] || variants.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {duplicateGroups.length > 0 ? (
        duplicateGroups.map((group) => (
          <Card key={group.full_identifier}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileX className="h-5 w-5 text-destructive" />
                Identificador Duplicado: {group.full_identifier}
                <Badge variant="destructive">{group.acts.length} actas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Censo</TableHead>
                    <TableHead>Votantes</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.acts.map((act) => (
                    <TableRow key={act.id} className="bg-destructive/5">
                      <TableCell>{act.municipio || 'Sin municipio'}</TableCell>
                      <TableCell>{act.census_total}</TableCell>
                      <TableCell>{act.total_voters}</TableCell>
                      <TableCell>{getSourceBadge(act.source_type)}</TableCell>
                      <TableCell>{getStatusBadge(act)}</TableCell>
                      <TableCell>
                        {format(new Date(act.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditAct(act)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewAudit(act)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Historial
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron actas duplicadas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Todas las actas tienen identificadores únicos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
