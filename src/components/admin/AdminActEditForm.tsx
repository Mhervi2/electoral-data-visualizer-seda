import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ElectoralActAdmin } from '@/hooks/useElectoralActsAdmin';
import { useAppData } from '@/hooks/useAppData';
import { MunicipalitySelector } from '@/components/acta/MunicipalitySelector';
import { validateActaData, validateActaDataWithWarnings } from '@/utils/actaValidation';
import { useToast } from '@/hooks/use-toast';
import { ValidationWarningDialog } from '@/components/ui/validation-warning-dialog';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { DraggablePartyList } from './DraggablePartyList';
import { usePartyOrder } from '@/hooks/usePartyOrder';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { FullMesaIdentifier } from '@/components/ui/mesa-identifier-display';

interface AdminActEditFormProps {
  act: ElectoralActAdmin;
  onSave: (
    updates: Partial<ElectoralActAdmin>,
    partyVotes: { party_id: string; votes: number }[],
    mailVotes: { dni: string }[]
  ) => Promise<boolean>;
  onCancel: () => void;
  onDelete: (actId: string) => Promise<boolean>;
}

export const AdminActEditForm: React.FC<AdminActEditFormProps> = ({
  act,
  onSave,
  onCancel,
  onDelete
}) => {
  const { toast } = useToast();
  const { isMailVotingEnabled } = useSystemSettings();
  const { politicalParties, mpcaData } = useAppData();

  const [formData, setFormData] = useState({
    mesa_identifier: act.mesa_identifier || '',
    municipality_idm: act.municipality_idm || null,
    census_total: act.census_total || 0,
    total_voters: act.total_voters || 0,
    blank_votes: act.blank_votes,
    null_votes: act.null_votes,
    observations: act.observations || '',
  });

  const [partyVotes, setPartyVotes] = useState<{ party_id: string; votes: number }[]>([]);
  const [mailVotes, setMailVotes] = useState<{ dni: string }[]>(act.mail_votes || []);
  const [newMailDni, setNewMailDni] = useState('');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllParties, setShowAllParties] = useState(true);

  useEffect(() => {
    // Initialize party votes
    if (politicalParties) {
      const initialVotes = politicalParties.map(party => {
        const existingVote = act.party_votes.find(pv => pv.party_id === party.id);
        return {
          party_id: party.id,
          votes: existingVote?.votes || 0
        };
      });
      setPartyVotes(initialVotes);
    }
  }, [politicalParties, act.party_votes]);

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'observations') {
      setFormData(prev => ({
        ...prev,
        [field]: value as string
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: typeof value === 'string' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handlePartyVoteChange = (partyId: string, votes: string) => {
    setPartyVotes(prev => 
      prev.map(pv => 
        pv.party_id === partyId 
          ? { ...pv, votes: parseInt(votes) || 0 }
          : pv
      )
    );
  };

  const handleAddMailVote = () => {
    if (newMailDni.trim()) {
      setMailVotes(prev => [...prev, { dni: newMailDni.trim() }]);
      setNewMailDni('');
    }
  };

  const handleRemoveMailVote = (index: number) => {
    setMailVotes(prev => prev.filter((_, i) => i !== index));
  };

  const handleMunicipalityChange = (municipalityId: string) => {
    const municipalityIdm = parseInt(municipalityId);
    setFormData(prev => ({ ...prev, municipality_idm: municipalityIdm }));
  };

  const handleSave = async () => {
    // Transform party votes to the expected format for validation
    const votos = partyVotes.reduce((acc, pv) => {
      acc[pv.party_id] = pv.votes.toString();
      return acc;
    }, {} as { [key: string]: string });

    // Validate data only if it's a complete act
    const isImageOnlyAct = act.completion_status === 'image_only';
    
    if (!isImageOnlyAct) {
      const actaData = {
        electionId: act.election_id,
        municipio: formData.municipality_idm?.toString() || '',
        mesaIdentifier: formData.mesa_identifier || '',
        censo: formData.census_total?.toString() || '0',
        votantes: formData.total_voters?.toString() || '0',
        blancos: formData.blank_votes.toString(),
        nulos: formData.null_votes.toString(),
        votos: votos,
        mailVoters: mailVotes,
        imageUrl: act.image_url
      };

      const validation = validateActaDataWithWarnings(actaData);
      
      // Check for critical errors first
      if (validation.hasErrors) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: validation.errors.join(' '),
        });
        return;
      }

      // If there are warnings, show confirmation dialog
      if (validation.hasWarnings) {
        setValidationWarnings(validation.warnings);
        setShowWarningDialog(true);
        return;
      }
    }

    await saveInternal();
  };

  const saveInternal = async () => {
    const success = await onSave(formData, partyVotes, mailVotes);
    if (success) {
      toast({
        title: "Éxito",
        description: "Acta actualizada correctamente."
      });
    }
  };

  const handleWarningDialogContinue = async () => {
    setShowWarningDialog(false);
    await saveInternal();
  };

  const handleWarningDialogCancel = () => {
    setShowWarningDialog(false);
  };

  const handleDelete = async () => {
    const success = await onDelete(act.id);
    if (success) {
      setShowDeleteDialog(false);
    }
  };

  const selectedMunicipality = mpcaData?.find(m => m.idm === formData.municipality_idm);
  
  // Debug logging for municipality and province
  useEffect(() => {
    console.log('🏛️ AdminActEditForm - Municipality info:', {
      municipalityIdm: formData.municipality_idm,
      selectedMunicipality: selectedMunicipality ? {
        idm: selectedMunicipality.idm,
        municipio: selectedMunicipality.municipio,
        provincia: selectedMunicipality.provincia
      } : null,
      mpcaDataLoaded: !!mpcaData,
      mpcaDataLength: mpcaData?.length || 0
    });
  }, [formData.municipality_idm, selectedMunicipality, mpcaData]);
  
  // Use party order hook for draggable functionality
  const { orderedParties, loading: orderLoading, updatePartyOrder } = usePartyOrder(
    act.provincia,
    politicalParties || []
  );

  // Convert votos to the format expected by DraggablePartyList
  const votos = partyVotes.reduce((acc, pv) => {
    acc[pv.party_id] = pv.votes.toString();
    return acc;
  }, {} as { [key: string]: string });

  const handlePartyOrderChange = (newOrder: any[]) => {
    updatePartyOrder(newOrder);
  };

  const handleVoteChange = (partyId: string, votes: string) => {
    handlePartyVoteChange(partyId, votes);
  };

  return (
    <div className="space-y-6">
      {act.completion_status === 'image_only' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Acta de Solo Imagen:</strong> Esta acta fue creada con solo imagen y requiere completar los datos faltantes.
          </p>
        </div>
      )}
      
      {/* Layout de 2 columnas */}
      <div className={`${act.image_url ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
        {/* Columna izquierda - Imagen */}
        {act.image_url && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Imagen del Acta</CardTitle>
                <p className="text-sm text-muted-foreground">Haz clic en la imagen para ampliarla</p>
              </CardHeader>
              <CardContent>
                <ZoomableImage 
                  src={act.image_url} 
                  alt="Imagen del acta"
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Columna derecha - Formulario */}
        <div className="space-y-6">

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className={`grid w-full ${isMailVotingEnabled() ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
          <TabsTrigger value="votes">Votos por Partido</TabsTrigger>
          {isMailVotingEnabled() && (
            <TabsTrigger value="mail">Votos por Correo</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mostrar identificador completo si está disponible */}
              {(act.mesa_identifier_full || act.full_identifier) && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium">Identificador Completo</Label>
                  <div className="mt-1">
                    <FullMesaIdentifier
                      mesaIdentifierFull={act.mesa_identifier_full}
                      fullIdentifier={act.full_identifier}
                      variant="outline"
                      size="default"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mesa_identifier">Identificador de Mesa</Label>
                  <Input
                    id="mesa_identifier"
                    value={formData.mesa_identifier || ''}
                    onChange={(e) => handleInputChange('mesa_identifier', e.target.value)}
                    placeholder="01-001-A"
                  />
                </div>
                <div>
                  <Label>Municipio</Label>
                  <MunicipalitySelector
                    selectedMunicipalityId={formData.municipality_idm?.toString() || ''}
                    onMunicipalitySelect={(municipalityId) => handleMunicipalityChange(municipalityId)}
                  />
                  {selectedMunicipality && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMunicipality.provincia}, {selectedMunicipality.ca}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="census_total">Censo Total</Label>
                  <Input
                    id="census_total"
                    type="number"
                    value={formData.census_total || 0}
                    onChange={(e) => handleInputChange('census_total', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="total_voters">Total Votantes</Label>
                  <Input
                    id="total_voters"
                    type="number"
                    value={formData.total_voters || 0}
                    onChange={(e) => handleInputChange('total_voters', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="null_votes">Votos Nulos</Label>
                  <Input
                    id="null_votes"
                    type="number"
                    value={formData.null_votes}
                    onChange={(e) => handleInputChange('null_votes', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="blank_votes">Votos en Blanco</Label>
                  <Input
                    id="blank_votes"
                    type="number"
                    value={formData.blank_votes}
                    onChange={(e) => handleInputChange('blank_votes', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Observations field */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Observaciones opcionales sobre el acta electoral..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="votes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Votos por Partido Político</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gestiona los votos de cada partido político
                  </p>
                </div>
                
                {/* Toggle button for showing/hiding parties */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllParties(!showAllParties)}
                  className="flex items-center gap-2"
                >
                  {showAllParties ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAllParties ? 'Ocultar sin votos' : 'Mostrar todos'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando orden de partidos...
                </div>
              ) : (
                <DraggablePartyList
                  parties={orderedParties}
                  votos={votos}
                  onVoteChange={handleVoteChange}
                  onPartyOrderChange={handlePartyOrderChange}
                  provincia={selectedMunicipality?.provincia}
                  showAllParties={showAllParties}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isMailVotingEnabled() && (
          <TabsContent value="mail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Votos por Correo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="DNI del votante por correo"
                    value={newMailDni}
                    onChange={(e) => setNewMailDni(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMailVote()}
                  />
                  <Button onClick={handleAddMailVote} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {mailVotes.map((voter, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{voter.dni}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMailVote(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-between items-center">
        <div>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar Acta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar acta electoral?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <div>
                    Esta acción eliminará permanentemente toda la información del acta:
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div><strong>Mesa:</strong> {act.mesa_identifier}</div>
                    <div><strong>Municipio:</strong> {act.municipio || 'Sin municipio'}</div>
                    <div><strong>Censo:</strong> {act.census_total}</div>
                    <div><strong>Votantes:</strong> {act.total_voters}</div>
                  </div>
                  <div className="text-destructive font-medium">
                    ⚠️ Esta acción no se puede deshacer y eliminará todos los votos, historial de cambios y datos asociados.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Eliminar definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Guardar Cambios
          </Button>
        </div>
      </div>
        </div>
      </div>

      <ValidationWarningDialog
        open={showWarningDialog}
        onOpenChange={() => {}}
        warnings={validationWarnings}
        onContinue={handleWarningDialogContinue}
        onCancel={handleWarningDialogCancel}
      />
    </div>
  );
};
