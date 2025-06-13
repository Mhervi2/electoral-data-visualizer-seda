
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Download, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileRecord {
  id: string;
  filename: string;
  electionId: string;
  sourceType: 'indra' | 'escrutinio' | 'oficial';
  scope: string;
  uploadDate: string;
  downloadUrl?: string;
}

const AdminFiles = () => {
  const { toast } = useToast();
  
  const [mockElections] = useState([
    { id: '1', name: 'Elecciones Municipales 2023' },
    { id: '2', name: 'Elecciones Generales 2023' }
  ]);

  const [files] = useState<FileRecord[]>([
    {
      id: '1',
      filename: 'Resultados_Indra_Municipales_2023.xlsx',
      electionId: '1',
      sourceType: 'indra',
      scope: 'Nacional',
      uploadDate: '2023-05-29',
    },
    {
      id: '2',
      filename: 'Escrutinio_Oficial_Generales_2023.xlsx',
      electionId: '2',
      sourceType: 'escrutinio',
      scope: 'Nacional',
      uploadDate: '2023-07-24',
    }
  ]);

  const getElectionName = (electionId: string) => {
    const election = mockElections.find(e => e.id === electionId);
    return election?.name || 'Elección desconocida';
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'indra': 'Indra',
      'escrutinio': 'Escrutinio',
      'oficial': 'Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const getSourceTypeBadgeVariant = (sourceType: string) => {
    const variants = {
      'indra': 'default',
      'escrutinio': 'secondary',
      'oficial': 'outline'
    };
    return variants[sourceType as keyof typeof variants] || 'outline';
  };

  const handleDelete = (fileId: string, filename: string) => {
    toast({
      title: "Archivo eliminado (simulado)",
      description: `El archivo "${filename}" ha sido eliminado.`,
    });
  };

  const handleDownload = (filename: string) => {
    toast({
      title: "Descarga iniciada (simulado)",
      description: `Descargando archivo: ${filename}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Gestionar Ficheros de Resultados</h1>
            <p className="text-muted-foreground">
              Administra todos los archivos de resultados electorales.
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
            <Link to="/admin/files/upload">
              <Plus className="h-4 w-4 mr-2" />
              Subir Nuevo Fichero
            </Link>
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos de Resultados</CardTitle>
          <CardDescription>
            Todos los ficheros de resultados subidos al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Fichero</TableHead>
                <TableHead>Elección</TableHead>
                <TableHead>Tipo de Fuente</TableHead>
                <TableHead>Ámbito</TableHead>
                <TableHead>Fecha de Subida</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>{getElectionName(file.electionId)}</TableCell>
                  <TableCell>
                    <Badge variant={getSourceTypeBadgeVariant(file.sourceType) as any}>
                      {getSourceTypeLabel(file.sourceType)}
                    </Badge>
                  </TableCell>
                  <TableCell>{file.scope}</TableCell>
                  <TableCell>{new Date(file.uploadDate).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(file.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(file.id, file.filename)}
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

export default AdminFiles;
