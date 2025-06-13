
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Plus, Edit, Trash2, ArrowLeft, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Election {
  id: string;
  name: string;
  date: string;
  type: string;
  status: 'active' | 'closed';
  created_at: string;
}

const AdminElections = () => {
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las elecciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleElectionStatus = async (electionId: string, currentStatus: string, electionName: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    
    try {
      const { error } = await supabase
        .from('elections')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', electionId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `La elección "${electionName}" ha sido ${newStatus === 'active' ? 'activada' : 'cerrada'}.`,
      });

      fetchElections();
    } catch (error) {
      console.error('Error updating election status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la elección.",
      });
    }
  };

  const handleDelete = async (electionId: string, electionName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la elección "${electionName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId);

      if (error) throw error;

      toast({
        title: "Elección eliminada",
        description: `La elección "${electionName}" ha sido eliminada.`,
      });

      fetchElections();
    } catch (error) {
      console.error('Error deleting election:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la elección.",
      });
    }
  };

  if (loading) {
    return <div>Cargando elecciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Gestionar Elecciones</h1>
            <p className="text-muted-foreground">
              Administra todos los procesos electorales del sistema.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Admin
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/elections/new">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Elección
            </Link>
          </Button>
        </div>
      </div>

      {/* Elections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Elecciones</CardTitle>
          <CardDescription>
            Todas las elecciones configuradas en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => (
                <TableRow key={election.id}>
                  <TableCell className="font-medium">{election.name}</TableCell>
                  <TableCell>{new Date(election.date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>{election.type}</TableCell>
                  <TableCell>
                    <Badge variant={election.status === 'active' ? 'default' : 'secondary'}>
                      {election.status === 'active' ? 'Activa' : 'Cerrada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleElectionStatus(election.id, election.status, election.name)}
                      >
                        {election.status === 'active' ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Cerrar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(election.id, election.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminElections;
