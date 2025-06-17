
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useOptimizedActaData } from '@/hooks/useOptimizedActaData';

const PoliticalParties = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartySiglas, setNewPartySiglas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const { 
    politicalParties, 
    loading, 
    error, 
    refetchParties 
  } = useOptimizedActaData();

  const filteredParties = politicalParties.filter(party =>
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.siglas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuggestParty = async () => {
    if (!newPartyName.trim() || !newPartySiglas.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para sugerir un partido.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo verificar la sesión del usuario.",
        });
        return;
      }

      const { error } = await supabase
        .from('party_suggestions')
        .insert({
          name: newPartyName.trim(),
          siglas: newPartySiglas.trim(),
          suggested_by: authUser.id
        });

      if (error) {
        console.error('Error submitting suggestion:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `No se pudo enviar la sugerencia: ${error.message}`,
        });
        return;
      }

      toast({
        title: "Sugerencia enviada",
        description: `Hemos recibido tu sugerencia para añadir "${newPartyName} (${newPartySiglas})". Los administradores la revisarán pronto.`,
      });

      setNewPartyName('');
      setNewPartySiglas('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la sugerencia. Inténtalo de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando partidos políticos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium">Error al cargar los partidos políticos</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetchParties}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Partidos Políticos
          </h1>
          <p className="text-muted-foreground mt-2">
            Partidos que participan en el proceso electoral actual
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refetchParties} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Sugerir Nuevo Partido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sugerir Nuevo Partido</DialogTitle>
                <DialogDescription>
                  Si falta algún partido político en el listado, puedes sugerirlo aquí.
                  Los administradores revisarán tu sugerencia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="party-name">Nombre del Partido *</Label>
                  <Input
                    id="party-name"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="Ej: Nuevo Partido Democrático"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="party-siglas">Siglas *</Label>
                  <Input
                    id="party-siglas"
                    value={newPartySiglas}
                    onChange={(e) => setNewPartySiglas(e.target.value)}
                    placeholder="Ej: NPD"
                    disabled={submitting}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSuggestParty} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o siglas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Partidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParties.map((party) => (
          <Card key={party.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: party.color || '#6B7280' }}
                >
                  {party.siglas}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight">{party.siglas}</CardTitle>
                  <CardDescription className="text-xs">
                    {party.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>Participante activo</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParties.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 
                "No se encontraron partidos que coincidan con tu búsqueda." :
                "No hay partidos políticos disponibles."
              }
            </p>
            {!searchTerm && (
              <Button variant="outline" onClick={refetchParties} className="mt-4">
                Reintentar carga
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La lista de partidos políticos es gestionada por los administradores del sistema.
            Si detectas la falta de algún partido o encuentras información incorrecta,
            utiliza el botón "Sugerir Nuevo Partido" para notificarlo.
          </p>
          <div className="mt-4 text-xs text-green-600">
            ✅ {politicalParties.length} partidos cargados correctamente
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PoliticalParties;
