import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IndraFileUpload } from '@/components/admin/IndraFileUpload';

const AdminFilesUpload = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [mockElections] = useState([
    { id: '1', name: 'Elecciones Municipales 2023' },
    { id: '2', name: 'Elecciones Generales 2023' }
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un archivo para subir.",
      });
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const uploadData = {
      election: formData.get('election'),
      sourceType: formData.get('sourceType'),
      scope: formData.get('scope'),
      file: selectedFile
    };

    console.log('Subir archivo (simulado):', uploadData);
    
    toast({
      title: "Archivo subido (simulado)",
      description: `El archivo "${selectedFile.name}" ha sido procesado correctamente.`,
    });

    // Reset form
    setSelectedFile(null);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Subir Fichero de Resultados</h1>
            <p className="text-muted-foreground">
              Sube archivos de resultados electorales desde diferentes fuentes.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/files">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Ficheros
          </Link>
        </Button>
      </div>

      {/* Upload Tabs */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Carga Manual</TabsTrigger>
          <TabsTrigger value="indra">Archivo INDRA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Información del Archivo</CardTitle>
              <CardDescription>
                Configura los detalles del archivo que vas a subir manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="election">Elección Asociada *</Label>
                  <Select name="election" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la elección" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockElections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceType">Tipo de Fuente del Fichero *</Label>
                  <Select name="sourceType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indra">Indra</SelectItem>
                      <SelectItem value="escrutinio">Escrutinio</SelectItem>
                      <SelectItem value="oficial">Oficial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Ámbito del Fichero *</Label>
                  <Select name="scope" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el ámbito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="comunidad-autonoma">C. Autónoma</SelectItem>
                      <SelectItem value="provincia">Provincia</SelectItem>
                      <SelectItem value="municipio">Municipio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Archivo Excel/CSV *</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      required
                      className="flex-1"
                    />
                    {selectedFile && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Formatos soportados: .xlsx, .xls, .csv (máximo 10MB)
                  </p>
                </div>

                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-medium mb-2">Formato del Archivo:</h4>
                  <p className="text-sm text-muted-foreground">
                    El archivo debe contener las columnas: Provincia, Municipio, Distrito, Sección, Mesa, 
                    y una columna por cada partido político con sus respectivos votos.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Fichero
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="indra" className="space-y-6">
          <IndraFileUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFilesUpload;
