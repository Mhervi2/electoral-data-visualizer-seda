
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  name: string;
  date: string;
  type: string;
  status: 'active' | 'closed';
}

const AdminElections = () => {
  const { toast } = useToast();
  const [elections] = useState<Election[]>([
    {
      id: '1',
      name: 'Elecciones Municipales 2023',
      date: '2023-05-28',
      type: 'Municipal',
      status: 'closed'
    },
    {
      id: '2',
      name: 'Elecciones Generales 2023',
      date: '2023-07-23',
      type: 'General',
      status: 'active'
    }
  ]);

  const handleDelete = (electionId: string, electionName: string) => {
    toast({
      title: "Elección eliminada (simulado)",
      description: `La elección "${electionName}" ha sido eliminada.`,
    });
  };

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
