
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Users } from 'lucide-react';

// Mock data
const initialParties = [
  {
    id: 'psoe',
    name: 'Partido Socialista Obrero Español',
    siglas: 'PSOE',
    color: '#E53E3E',
    logo: 'https://placehold.co/60x60/E53E3E/FFFFFF.png?text=PSOE'
  },
  {
    id: 'pp',
    name: 'Partido Popular',
    siglas: 'PP',
    color: '#3182CE',
    logo: 'https://placehold.co/60x60/3182CE/FFFFFF.png?text=PP'
  },
  {
    id: 'podemos',
    name: 'Podemos',
    siglas: 'UP',
    color: '#805AD5',
    logo: 'https://placehold.co/60x60/805AD5/FFFFFF.png?text=UP'
  },
  {
    id: 'vox',
    name: 'Vox',
    siglas: 'VOX',
    color: '#38A169',
    logo: 'https://placehold.co/60x60/38A169/FFFFFF.png?text=VOX'
  },
  {
    id: 'cs',
    name: 'Ciudadanos',
    siglas: 'Cs',
    color: '#D69E2E',
    logo: 'https://placehold.co/60x60/D69E2E/FFFFFF.png?text=Cs'
  },
  {
    id: 'erc',
    name: 'Esquerra Republicana de Catalunya',
    siglas: 'ERC',
    color: '#F56565',
    logo: 'https://placehold.co/60x60/F56565/FFFFFF.png?text=ERC'
  },
  {
    id: 'pnv',
    name: 'Partido Nacionalista Vasco',
    siglas: 'PNV',
    color: '#48BB78',
    logo: 'https://placehold.co/60x60/48BB78/FFFFFF.png?text=PNV'
  },
  {
    id: 'bildu',
    name: 'EH Bildu',
    siglas: 'Bildu',
    color: '#4FD1C7',
    logo: 'https://placehold.co/60x60/4FD1C7/FFFFFF.png?text=Bildu'
  },
];

const PoliticalParties = () => {
  const [parties] = useState(initialParties);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartySiglas, setNewPartySiglas] = useState('');
  const { toast } = useToast();

  const filteredParties = parties.filter(party =>
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.siglas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuggestParty = () => {
    if (!newPartyName.trim() || !newPartySiglas.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos.",
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
  };

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
                />
              </div>
              <div>
                <Label htmlFor="party-siglas">Siglas *</Label>
                <Input
                  id="party-siglas"
                  value={newPartySiglas}
                  onChange={(e) => setNewPartySiglas(e.target.value)}
                  placeholder="Ej: NPD"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSuggestParty} className="flex-1">
                  Enviar Sugerencia
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                  style={{ backgroundColor: party.color }}
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

      {filteredParties.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No se encontraron partidos que coincidan con tu búsqueda.
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PoliticalParties;
