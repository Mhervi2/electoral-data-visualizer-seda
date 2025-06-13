
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Party {
  id: string;
  name: string;
  acronym: string;
  color: string;
  logoUrl?: string;
}

const AdminElectionsNew = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [newPartyDialog, setNewPartyDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    acronym: '',
    color: '#A80000',
    logoUrl: ''
  });

  const [mockExistingParties] = useState<Party[]>([
    { id: '1', name: 'Partido Popular', acronym: 'PP', color: '#0056b3' },
    { id: '2', name: 'Partido Socialista Obrero Español', acronym: 'PSOE', color: '#dc2625' },
    { id: '3', name: 'VOX', acronym: 'VOX', color: '#65a30d' },
    { id: '4', name: 'SUMAR', acronym: 'SUMAR', color: '#dc2789' },
    { id: '5', name: 'Esquerra Republicana de Catalunya', acronym: 'ERC', color: '#f59e0b' },
    { id: '6', name: 'Junts per Catalunya', acronym: 'JxCAT', color: '#06b6d4' },
    { id: '7', name: 'Partido Nacionalista Vasco', acronym: 'PNV', color: '#65a30d' },
    { id: '8', name: 'EH Bildu', acronym: 'BILDU', color: '#dc2625' },
  ]);

  const handlePartyToggle = (partyId: string) => {
    setSelectedParties(prev => 
      prev.includes(partyId) 
        ? prev.filter(id => id !== partyId)
        : [...prev, partyId]
    );
  };

  const handleAddNewParty = () => {
    if (!newParty.name || !newParty.acronym) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y las siglas son obligatorios.",
      });
      return;
    }

    toast({
      title: "Partido añadido (simulado)",
      description: `El partido "${newParty.name}" ha sido añadido a la lista.`,
    });

    setNewParty({ name: '', acronym: '', color: '#A80000', logoUrl: '' });
    setNewPartyDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const electionData = {
      name: formData.get('name'),
      date: date,
      type: formData.get('type'),
      scope: formData.get('scope'),
      totalSeats: formData.get('totalSeats'),
      selectedParties: selectedParties
    };

    console.log('Nueva elección (simulado):', electionData);
    
    toast({
      title: "Elección creada (simulado)",
      description: "La nueva elección ha sido configurada correctamente.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Nueva Elección</h1>
            <p className="text-muted-foreground">
              Configura un nuevo proceso electoral.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/elections">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Elecciones
          </Link>
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos principales de la elección.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Elección *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Elecciones Generales 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de la Elección *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Elecciones *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="autonomica">Autonómica</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="europea">Europea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Ámbito Geográfico *</Label>
                <Select name="scope" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el ámbito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="comunidad-autonoma">Comunidad Autónoma</SelectItem>
                    <SelectItem value="provincia">Provincia</SelectItem>
                    <SelectItem value="municipio">Municipio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSeats">Número Total de Escaños (opcional)</Label>
                <Input
                  id="totalSeats"
                  name="totalSeats"
                  type="number"
                  min="1"
                  placeholder="Ej: 350"
                />
              </div>
            </CardContent>
          </Card>

          {/* Political Parties */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Partidos Políticos Participantes *</CardTitle>
                  <CardDescription>
                    Selecciona los partidos que participan en esta elección.
                  </CardDescription>
                </div>
                <Dialog open={newPartyDialog} onOpenChange={setNewPartyDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Partido</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="partyName">Nombre *</Label>
                        <Input
                          id="partyName"
                          value={newParty.name}
                          onChange={(e) => setNewParty(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nombre completo del partido"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partyAcronym">Siglas *</Label>
                        <Input
                          id="partyAcronym"
                          value={newParty.acronym}
                          onChange={(e) => setNewParty(prev => ({ ...prev, acronym: e.target.value }))}
                          placeholder="Ej: PP, PSOE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partyColor">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="partyColor"
                            type="color"
                            value={newParty.color}
                            onChange={(e) => setNewParty(prev => ({ ...prev, color: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: newParty.color }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partyLogo">URL del Logo (opcional)</Label>
                        <Input
                          id="partyLogo"
                          value={newParty.logoUrl}
                          onChange={(e) => setNewParty(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setNewPartyDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" onClick={handleAddNewParty}>
                          Añadir Partido
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockExistingParties.map((party) => (
                  <div key={party.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={party.id}
                      checked={selectedParties.includes(party.id)}
                      onCheckedChange={() => handlePartyToggle(party.id)}
                    />
                    <div 
                      className="w-4 h-4 rounded-sm border"
                      style={{ backgroundColor: party.color }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={party.id} className="font-medium cursor-pointer">
                        {party.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{party.acronym}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedParties.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Selecciona al menos un partido político para continuar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={selectedParties.length === 0}>
            Crear Elección
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminElectionsNew;
