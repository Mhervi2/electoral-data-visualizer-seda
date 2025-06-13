import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, Eye, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Municipality {
  id: string;
  name: string;
  province: { name: string; autonomous_community: { name: string } };
}

interface PoliticalParty {
  id: string;
  name: string;
  siglas: string;
}

interface Election {
  id: string;
  name: string;
  status: string;
}

interface ExistingAct {
  id: string;
  municipality: { name: string };
  district: string;
  section: string;
  table_letter: string;
  source_type: string;
  created_at: string;
}

interface ActaData {
  electionId: string;
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
  const { user } = useAuth();
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [existingAct, setExistingAct] = useState<ExistingAct | null>(null);
  const [showExistingActDialog, setShowExistingActDialog] = useState(false);
  
  const [actaData, setActaData] = useState<ActaData>({
    electionId: '',
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMunicipalities();
    fetchPoliticalParties();
    fetchElections();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const { data, error } = await supabase
        .from('municipalities')
        .select(`
          id,
          name,
          province:provinces (
            name,
            autonomous_community:autonomous_communities (
              name
            )
          )
        `)
        .order('name');

      if (error) throw error;
      setMunicipalities(data || []);
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    }
  };

  const fetchPoliticalParties = async () => {
    try {
      const { data, error } = await supabase
        .from('political_parties')
        .select('*')
        .order('siglas');

      if (error) throw error;
      setPoliticalParties(data || []);
    } catch (error) {
      console.error('Error fetching political parties:', error);
    }
  };

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const checkExistingAct = async () => {
    if (!actaData.electionId || !actaData.municipio || !actaData.distrito || !actaData.seccion || !actaData.mesa) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('electoral_acts')
        .select(`
          id,
          district,
          section,
          table_letter,
          source_type,
          created_at,
          municipality:municipalities (
            name
          )
        `)
        .eq('election_id', actaData.electionId)
        .eq('municipality_id', actaData.municipio)
        .eq('district', actaData.distrito)
        .eq('section', actaData.seccion)
        .eq('table_letter', actaData.mesa)
        .single();

      if (data && !error) {
        setExistingAct(data);
        setShowExistingActDialog(true);
        return true;
      }
      return false;
    } catch (error) {
      // No existing act found, which is expected
      return false;
    }
  };

  const selectedMunicipality = municipalities.find(m => m.id === actaData.municipio);

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
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para enviar un acta.",
      });
      return;
    }

    if (!validateData()) return;

    // Check for existing act
    const hasExisting = await checkExistingAct();
    if (hasExisting) return;

    setIsSubmitting(true);
    
    try {
      // Insert electoral act
      const { data: actData, error: actError } = await supabase
        .from('electoral_acts')
        .insert({
          election_id: actaData.electionId,
          municipality_id: actaData.municipio,
          district: actaData.distrito,
          section: actaData.seccion,
          table_letter: actaData.mesa,
          census_total: parseInt(actaData.censo),
          total_voters: parseInt(actaData.votantes),
          blank_votes: parseInt(actaData.blancos),
          null_votes: parseInt(actaData.nulos),
          source_type: 'user',
          submitted_by: user.id
        })
        .select()
        .single();

      if (actError) throw actError;

      // Insert party votes
      const partyVotesData = Object.entries(actaData.votos)
        .filter(([_, votes]) => votes && parseInt(votes) > 0)
        .map(([partyId, votes]) => ({
          electoral_act_id: actData.id,
          party_id: partyId,
          votes: parseInt(votes)
        }));

      if (partyVotesData.length > 0) {
        const { error: votesError } = await supabase
          .from('party_votes')
          .insert(partyVotesData);

        if (votesError) throw votesError;
      }

      toast({
        title: "Acta enviada",
        description: "El acta electoral ha sido enviada correctamente.",
      });

      // Reset form
      setActaData({
        electionId: '',
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

    } catch (error) {
      console.error('Error submitting act:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el acta. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Acta de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
        Enviar Acta Electoral
      </h1>

      {/* Existing Act Dialog */}
      <Dialog open={showExistingActDialog} onOpenChange={setShowExistingActDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Acta Ya Existente
            </DialogTitle>
            <DialogDescription>
              Ya existe un acta para esta mesa electoral.
            </DialogDescription>
          </DialogHeader>
          {existingAct && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/20 rounded-lg">
                <h4 className="font-medium mb-2">Detalles del Acta Existente:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Municipio:</strong> {existingAct.municipality?.name}</p>
                  <p><strong>Distrito:</strong> {existingAct.district}</p>
                  <p><strong>Sección:</strong> {existingAct.section}</p>
                  <p><strong>Mesa:</strong> {existingAct.table_letter}</p>
                  <p><strong>Fuente:</strong> {getSourceTypeLabel(existingAct.source_type)}</p>
                  <p><strong>Fecha:</strong> {new Date(existingAct.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowExistingActDialog(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => setShowExistingActDialog(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Election Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selección de Elección</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="election">Elección *</Label>
              <Select value={actaData.electionId} onValueChange={(value) => handleInputChange('electionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar elección" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map(election => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                    {municipalities.map(municipality => (
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
                    <Input value={selectedMunicipality.province.name} disabled />
                  </div>
                  <div>
                    <Label>Comunidad Autónoma</Label>
                    <Input value={selectedMunicipality.province.autonomous_community.name} disabled />
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
                  onBlur={checkExistingAct}
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
                  onBlur={checkExistingAct}
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
                  onBlur={checkExistingAct}
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
              {politicalParties.map(partido => (
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
    </div>
  );
};

export default SubmitActa;
