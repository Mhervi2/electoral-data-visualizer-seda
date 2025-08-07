import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  UnresolvedMunicipality, 
  MunicipalitySuggestion, 
  MunicipalityResolution,
  useMunicipalityResolution 
} from '@/hooks/useMunicipalityResolution';
import { MpcaData } from '@/types/acta';
import { useToast } from '@/hooks/use-toast';

interface MunicipalityResolutionDialogProps {
  isOpen: boolean;
  unresolvedMunicipalities: UnresolvedMunicipality[];
  onResolutionsComplete: (resolutions: MunicipalityResolution[]) => void;
  onCancel: () => void;
}

const MunicipalityResolutionDialog: React.FC<MunicipalityResolutionDialogProps> = ({
  isOpen,
  unresolvedMunicipalities,
  onResolutionsComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { 
    findMunicipalitySuggestions, 
    getAvailableProvinces, 
    createNewMunicipality, 
    storeResolution,
    getStoredResolution,
    isLoading 
  } = useMunicipalityResolution();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<MunicipalitySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [resolutions, setResolutions] = useState<MunicipalityResolution[]>([]);
  const [provinces, setProvinces] = useState<Array<{ idp: number; provincia: string; idca: number; ca: string }>>([]);
  
  // New municipality form state
  const [newMunicipalityName, setNewMunicipalityName] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'create'>('suggestions');

  const currentMunicipality = unresolvedMunicipalities[currentIndex];
  const isLastMunicipality = currentIndex === unresolvedMunicipalities.length - 1;

  useEffect(() => {
    if (isOpen && unresolvedMunicipalities.length > 0) {
      loadProvinces();
      loadSuggestionsForCurrent();
    }
  }, [isOpen, currentIndex, unresolvedMunicipalities]);

  useEffect(() => {
    if (currentMunicipality) {
      setNewMunicipalityName(currentMunicipality.originalName);
      setActiveTab('suggestions');
    }
  }, [currentMunicipality]);

  const loadProvinces = async () => {
    try {
      const provinceData = await getAvailableProvinces();
      setProvinces(provinceData);
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  };

  const loadSuggestionsForCurrent = async () => {
    if (!currentMunicipality) return;

    setLoadingSuggestions(true);
    try {
      // First check if there's a stored resolution
      const storedResolution = await getStoredResolution(currentMunicipality.originalName);
      if (storedResolution) {
        // Auto-apply stored resolution
        handleSelectSuggestion(storedResolution);
        return;
      }

      const suggestionData = await findMunicipalitySuggestions(currentMunicipality);
      setSuggestions(suggestionData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sugerencias para este municipio."
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (municipality: MpcaData) => {
    const resolution: MunicipalityResolution = {
      originalName: currentMunicipality.originalName,
      resolution: municipality
    };

    setResolutions(prev => [...prev, resolution]);
    
    // Store resolution for future use
    storeResolution(currentMunicipality.originalName, municipality);

    if (isLastMunicipality) {
      onResolutionsComplete([...resolutions, resolution]);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCreateNewMunicipality = async () => {
    if (!newMunicipalityName.trim() || !selectedProvinceId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa todos los campos para crear el municipio."
      });
      return;
    }

    try {
      const selectedProvince = provinces.find(p => p.idp === selectedProvinceId);
      if (!selectedProvince) {
        throw new Error('Provincia no encontrada');
      }

      const newMunicipality = await createNewMunicipality({
        municipio: newMunicipalityName.trim(),
        idp: selectedProvince.idp,
        provincia: selectedProvince.provincia,
        idca: selectedProvince.idca,
        ca: selectedProvince.ca
      });

      const resolution: MunicipalityResolution = {
        originalName: currentMunicipality.originalName,
        resolution: newMunicipality,
        newMunicipalityData: {
          name: newMunicipalityName.trim(),
          provinciaId: selectedProvinceId
        }
      };

      setResolutions(prev => [...prev, resolution]);

      // Store resolution for future use
      storeResolution(currentMunicipality.originalName, newMunicipality);

      toast({
        title: "Municipio creado",
        description: `Se ha creado el municipio "${newMunicipality.municipio}" correctamente.`
      });

      if (isLastMunicipality) {
        onResolutionsComplete([...resolutions, resolution]);
      } else {
        setCurrentIndex(prev => prev + 1);
        setNewMunicipalityName('');
        setSelectedProvinceId(null);
      }

    } catch (error) {
      console.error('Error creating municipality:', error);
      toast({
        variant: "destructive",
        title: "Error al crear municipio",
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.8) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.9) return 'Excelente';
    if (score >= 0.8) return 'Buena';
    return 'Regular';
  };

  if (!currentMunicipality) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Resolver Municipio ({currentIndex + 1} de {unresolvedMunicipalities.length})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current municipality info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Municipio no encontrado</CardTitle>
              <CardDescription>
                El siguiente municipio del archivo Excel no pudo ser asociado automáticamente:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="font-medium text-lg">{currentMunicipality.originalName}</p>
                  {currentMunicipality.provincia && (
                    <p className="text-sm text-muted-foreground">Provincia: {currentMunicipality.provincia}</p>
                  )}
                  {currentMunicipality.ca && (
                    <p className="text-sm text-muted-foreground">Comunidad: {currentMunicipality.ca}</p>
                  )}
                </div>
                <Badge variant="outline">
                  Fila {currentMunicipality.rowIndex + 1}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Resolution tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'suggestions' | 'create')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suggestions" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Buscar Similar</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Crear Nuevo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-4">
              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selecciona el municipio correcto de las siguientes opciones:
                  </p>
                  {suggestions.map((suggestion, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectSuggestion(suggestion.municipality)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{suggestion.municipality.municipio}</h4>
                            <p className="text-sm text-muted-foreground">
                              {suggestion.municipality.provincia} • {suggestion.municipality.ca}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {suggestion.reason}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary"
                              className={`text-white ${getScoreColor(suggestion.score)}`}
                            >
                              {getScoreText(suggestion.score)}
                            </Badge>
                            <CheckCircle className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">No se encontraron coincidencias</h4>
                    <p className="text-sm text-muted-foreground">
                      No hay municipios similares en la base de datos. Puedes crear uno nuevo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Nuevo Municipio</CardTitle>
                  <CardDescription>
                    Introduce los datos del nuevo municipio que se agregará a la base de datos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="municipalityName">Nombre del Municipio</Label>
                    <Input
                      id="municipalityName"
                      value={newMunicipalityName}
                      onChange={(e) => setNewMunicipalityName(e.target.value)}
                      placeholder="Introduce el nombre del municipio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Select 
                      value={selectedProvinceId?.toString() || ''} 
                      onValueChange={(value) => setSelectedProvinceId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.idp} value={province.idp.toString()}>
                            {province.provincia} ({province.ca})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreateNewMunicipality}
                    disabled={!newMunicipalityName.trim() || !selectedProvinceId || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Municipio
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancelar Importación
            </Button>
            <div className="text-sm text-muted-foreground">
              {resolutions.length} de {unresolvedMunicipalities.length} resueltos
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MunicipalityResolutionDialog;