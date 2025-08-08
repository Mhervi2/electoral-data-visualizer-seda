import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Search, CheckCircle, AlertTriangle, Palette } from 'lucide-react';
import { 
  UnresolvedParty, 
  PartySuggestion, 
  PartyResolution,
  usePartyResolution 
} from '@/hooks/usePartyResolution';
import { useToast } from '@/hooks/use-toast';

interface PartyResolutionDialogProps {
  isOpen: boolean;
  unresolvedParties: UnresolvedParty[];
  onResolutionsComplete: (resolutions: PartyResolution[]) => void;
  onCancel: () => void;
}

const PartyResolutionDialog: React.FC<PartyResolutionDialogProps> = ({
  isOpen,
  unresolvedParties,
  onResolutionsComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { 
    findPartySuggestions, 
    createNewParty, 
    generateSiglas,
    generateRandomColor,
    isLoading 
  } = usePartyResolution();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<PartySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [resolutions, setResolutions] = useState<PartyResolution[]>([]);
  
  // New party form state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartySiglas, setNewPartySiglas] = useState('');
  const [newPartyColor, setNewPartyColor] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'create'>('suggestions');

  const currentParty = unresolvedParties[currentIndex];
  const isLastParty = currentIndex === unresolvedParties.length - 1;

  useEffect(() => {
    if (isOpen && unresolvedParties.length > 0) {
      loadSuggestionsForCurrent();
    }
  }, [isOpen, currentIndex, unresolvedParties]);

  useEffect(() => {
    if (currentParty) {
      setNewPartyName(currentParty.originalName);
      setNewPartySiglas(generateSiglas(currentParty.originalName));
      setNewPartyColor(generateRandomColor());
      setActiveTab('suggestions');
    }
  }, [currentParty]);

  const loadSuggestionsForCurrent = async () => {
    if (!currentParty) return;

    setLoadingSuggestions(true);
    try {
      const suggestionData = await findPartySuggestions(currentParty);
      setSuggestions(suggestionData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sugerencias para este partido."
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (party: any) => {
    const resolution: PartyResolution = {
      originalName: currentParty.originalName,
      resolution: party
    };

    setResolutions(prev => [...prev, resolution]);

    if (isLastParty) {
      onResolutionsComplete([...resolutions, resolution]);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCreateNewParty = async () => {
    if (!newPartyName.trim() || !newPartySiglas.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa el nombre y las siglas para crear el partido."
      });
      return;
    }

    try {
      const newParty = await createNewParty({
        name: newPartyName.trim(),
        siglas: newPartySiglas.trim(),
        color: newPartyColor
      });

      const resolution: PartyResolution = {
        originalName: currentParty.originalName,
        resolution: newParty,
        newPartyData: {
          name: newPartyName.trim(),
          siglas: newPartySiglas.trim(),
          color: newPartyColor
        }
      };

      setResolutions(prev => [...prev, resolution]);

      toast({
        title: "Partido creado",
        description: `Se ha creado el partido "${newParty.name}" correctamente.`
      });

      if (isLastParty) {
        onResolutionsComplete([...resolutions, resolution]);
      } else {
        setCurrentIndex(prev => prev + 1);
        setNewPartyName('');
        setNewPartySiglas('');
        setNewPartyColor(generateRandomColor());
      }

    } catch (error) {
      console.error('Error creating party:', error);
      toast({
        variant: "destructive",
        title: "Error al crear partido",
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  const handlePartyNameChange = (name: string) => {
    setNewPartyName(name);
    setNewPartySiglas(generateSiglas(name));
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

  if (!currentParty) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Resolver Partido Político ({currentIndex + 1} de {unresolvedParties.length})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current party info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partido no encontrado</CardTitle>
              <CardDescription>
                El siguiente partido del archivo Excel no pudo ser asociado automáticamente:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="font-medium text-lg">{currentParty.originalName}</p>
                  <p className="text-sm text-muted-foreground">
                    Columna {currentParty.columnIndex + 1} del archivo Excel
                  </p>
                </div>
                <Badge variant="outline">
                  Partido #{currentIndex + 1}
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
                    Selecciona el partido correcto de las siguientes opciones:
                  </p>
                  {suggestions.map((suggestion, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectSuggestion(suggestion.party)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: suggestion.party.color }}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{suggestion.party.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Siglas: {suggestion.party.siglas}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {suggestion.reason}
                              </p>
                            </div>
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
                      No hay partidos similares en la base de datos. Puedes crear uno nuevo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Nuevo Partido Político</CardTitle>
                  <CardDescription>
                    Introduce los datos del nuevo partido que se agregará a la base de datos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="partyName">Nombre del Partido</Label>
                    <Input
                      id="partyName"
                      value={newPartyName}
                      onChange={(e) => handlePartyNameChange(e.target.value)}
                      placeholder="Introduce el nombre completo del partido"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partySiglas">Siglas</Label>
                    <Input
                      id="partySiglas"
                      value={newPartySiglas}
                      onChange={(e) => setNewPartySiglas(e.target.value.toUpperCase())}
                      placeholder="Siglas del partido (ej. PP, PSOE, VOX)"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partyColor">Color del Partido</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="partyColor"
                        type="color"
                        value={newPartyColor}
                        onChange={(e) => setNewPartyColor(e.target.value)}
                        className="w-20 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={newPartyColor}
                        onChange={(e) => setNewPartyColor(e.target.value)}
                        placeholder="#ff0000"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewPartyColor(generateRandomColor())}
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateNewParty}
                    disabled={!newPartyName.trim() || !newPartySiglas.trim() || isLoading}
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
                        Crear Partido
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
              {resolutions.length} de {unresolvedParties.length} resueltos
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartyResolutionDialog;