
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Vote, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ElectionStatusManager from '@/components/admin/ElectionStatusManager';

interface Election {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
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
      console.log('Fetching elections...');
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching elections:', error);
        throw error;
      }

      console.log('Elections fetched:', data?.length || 0);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Vote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Gestión de Elecciones</h1>
            <p className="text-muted-foreground">
              Administra las elecciones del sistema y controla su estado.
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
          <CardTitle>Elecciones Registradas</CardTitle>
          <CardDescription>
            Administra el estado y configuración de todas las elecciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {elections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay elecciones registradas en el sistema.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elections.map((election) => (
                  <TableRow key={election.id}>
                    <TableCell className="font-medium">{election.name}</TableCell>
                    <TableCell>
                      <ElectionStatusManager 
                        election={election} 
                        onStatusChange={fetchElections}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(election.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      {election.updated_at 
                        ? new Date(election.updated_at).toLocaleDateString('es-ES')
                        : 'Sin actualizaciones'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        Ver Detalles
                      </Button>
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

export default AdminElections;
