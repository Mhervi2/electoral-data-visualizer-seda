
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, Eye, Plus } from 'lucide-react';

// Mock data
const mockMunicipalities = [
  { id: '28079', name: 'Madrid', province: 'Madrid', region: 'Comunidad de Madrid' },
  { id: '08019', name: 'Barcelona', province: 'Barcelona', region: 'Cataluña' },
  { id: '41091', name: 'Sevilla', province: 'Sevilla', region: 'Andalucía' },
];

const mockPartidos = [
  { id: 'psoe', name: 'PSOE', siglas: 'PSOE' },
  { id: 'pp', name: 'Partido Popular', siglas: 'PP' },
  { id: 'podemos', name: 'Podemos', siglas: 'UP' },
  { id: 'vox', name: 'Vox', siglas: 'VOX' },
  { id: 'cs', name: 'Ciudadanos', siglas: 'Cs' },
];

interface ActaData {
  municipio: string;
  distrito: string;
  seccion: string;
  mesa: string;
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  votos: { [key: string]: string };
  imagen?: File;
}

const SubmitActa = () => {
  const [actaData, setActaData] = useState<ActaData>({
    municipio: '',
    distrito: '',
    seccion: '',
    mesa: '',
    censo: '',
    votantes: '',
    blancos: '',
    nulos: '',
    votos: {},
  });
  const [submittedActas, setSubmittedActas] = useState<ActaData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const selectedMunicipality = mockMunicipalities.find(m => m.id === actaData.municipio);

  const handleInputChange = (field: keyof ActaData, value: string) => {
    setActaData(prev => ({ ...prev, [field]: value }));
  };

  const handleVoteChange = (partidoId: string, votes: string) => {
    setActaData(prev => ({
      ...prev,
      votos: { ...prev.votos, [partidoId]: votes }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActaData(prev => ({ ...prev, imagen: file }));
    }
  };

  const processWithOCR = () => {
    // Simulated OCR processing
    toast({
      title: "OCR Procesado",
      description: "Los datos han sido extraídos de la imagen (simulado).",
    });
    
    // Mock OCR results
    setActaData(prev => ({
      ...prev,
      censo: '1000',
      votantes: '850',
      blancos: '25',
      nulos: '15',
      votos: {
        psoe: '320',
        pp: '280',
        podemos: '150',
        vox: '75',
        cs: '5'
      }
    }));
  };

  const validateData = (): boolean => {
    const censo = parseInt(actaData.censo) || 0;
    const votantes = parseInt(actaData.votantes) || 0;
    const blancos = parseInt(actaData.blancos) || 0;
    const nulos = parseInt(actaData.nulos) || 0;
    
    const totalVotosCandidaturas = Object.values(actaData.votos)
      .reduce((sum, votes) => sum + (parseInt(votes) || 0), 0);

    if (votantes > censo) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El total de votantes no puede ser mayor que el censo.",
      });
      return false;
    }

    if (totalVotosCandidaturas + blancos + nulos !== votantes) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La suma de votos a candidaturas + blancos + nulos debe igual al total de votantes.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateData()) return;

    // Check if acta already exists
    const existingActa = submittedActas.find(acta => 
      acta.municipio === actaData.municipio &&
      acta.distrito === actaData.distrito &&
      acta.seccion === actaData.seccion &&
      acta.mesa === actaData.mesa
    );

    if (existingActa) {
      toast({
        variant: "destructive",
        title: "Acta ya existe",
        description: "Ya existe un acta para esta mesa electoral.",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSubmittedActas(prev => [...prev, { ...actaData }]);
    
    toast({
      title: "Acta enviada",
      description: "El acta electoral ha sido enviada correctamente.",
    });

    // Reset form
    setActaData({
      municipio: '',
      distrito: '',
      seccion: '',
      mesa: '',
      censo: '',
      votantes: '',
      blancos: '',
      nulos: '',
      votos: {},
    });

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
        Enviar Acta Electoral
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificación */}
        <Card>
          <CardHeader>
            <CardTitle>Identificación de la Mesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="municipio">Municipio *</Label>
                <Select value={actaData.municipio} onValueChange={(value) => handleInputChange('municipio', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMunicipalities.map(municipality => (
                      <SelectItem key={municipality.id} value={municipality.id}>
                        {municipality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedMunicipality && (
                <div className="space-y-2">
                  <div>
                    <Label>Provincia</Label>
                    <Input value={selectedMunicipality.province} disabled />
                  </div>
                  <div>
                    <Label>Comunidad Autónoma</Label>
                    <Input value={selectedMunicipality.region} disabled />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distrito">Distrito *</Label>
                <Input
                  id="distrito"
                  value={actaData.distrito}
                  onChange={(e) => handleInputChange('distrito', e.target.value)}
                  placeholder="Ej: 01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="seccion">Sección *</Label>
                <Input
                  id="seccion"
                  value={actaData.seccion}
                  onChange={(e) => handleInputChange('seccion', e.target.value)}
                  placeholder="Ej: 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mesa">Mesa *</Label>
                <Input
                  id="mesa"
                  value={actaData.mesa}
                  onChange={(e) => handleInputChange('mesa', e.target.value)}
                  placeholder="Ej: A"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imagen del Acta */}
        <Card>
          <CardHeader>
            <CardTitle>Imagen del Acta *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
              <Button type="button" variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Tomar Foto
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {actaData.imagen && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {actaData.imagen.name}
                </p>
                <Button type="button" onClick={processWithOCR} variant="secondary">
                  Procesar con OCR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datos del Acta */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Acta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="censo">Total Censo *</Label>
                <Input
                  id="censo"
                  type="number"
                  value={actaData.censo}
                  onChange={(e) => handleInputChange('censo', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="votantes">Total Votantes *</Label>
                <Input
                  id="votantes"
                  type="number"
                  value={actaData.votantes}
                  onChange={(e) => handleInputChange('votantes', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="blancos">Votos en Blanco *</Label>
                <Input
                  id="blancos"
                  type="number"
                  value={actaData.blancos}
                  onChange={(e) => handleInputChange('blancos', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nulos">Votos Nulos *</Label>
                <Input
                  id="nulos"
                  type="number"
                  value={actaData.nulos}
                  onChange={(e) => handleInputChange('nulos', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votos por Partido */}
        <Card>
          <CardHeader>
            <CardTitle>Votos a Candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPartidos.map(partido => (
                <div key={partido.id} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">{partido.siglas}</div>
                  <div className="flex-1 text-sm">{partido.name}</div>
                  <Input
                    type="number"
                    value={actaData.votos[partido.id] || ''}
                    onChange={(e) => handleVoteChange(partido.id, e.target.value)}
                    className="w-24"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar Acta Electoral'}
        </Button>
      </form>

      {/* Mis Actas Enviadas */}
      {submittedActas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis Actas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submittedActas.map((acta, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        Mesa {acta.mesa} - Sección {acta.seccion} - Distrito {acta.distrito}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {mockMunicipalities.find(m => m.id === acta.municipio)?.name}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubmitActa;
