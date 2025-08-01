import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePoliticalParties } from '@/hooks/usePoliticalParties';
import { useElectionManagement } from '@/hooks/useElectionManagement';

const AdminElectionsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { parties, loading: partiesLoading } = usePoliticalParties();
  const { updateElection, getElectionWithParties, loading: managementLoading } = useElectionManagement();
  
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<any>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [electionType, setElectionType] = useState('');
  const [scope, setScope] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [selectedParties, setSelectedParties] = useState<string[]>([]);

  useEffect(() => {
    const loadElection = async () => {
      if (!id) {
        navigate('/admin/elections');
        return;
      }

      try {
        setLoading(true);
        const electionData = await getElectionWithParties(id);
        
        setElection(electionData);
        setName(electionData.name || '');
        setDate((electionData as any).election_date ? new Date((electionData as any).election_date) : undefined);
        setElectionType((electionData as any).election_type || '');
        setScope((electionData as any).scope || '');
        setTotalSeats((electionData as any).total_seats?.toString() || '');
        setSelectedParties(electionData.selectedParties || []);
        
      } catch (error) {
        console.error('Error loading election:', error);
        navigate('/admin/elections');
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [id, getElectionWithParties, navigate]);

  const handlePartyToggle = (partyId: string) => {
    setSelectedParties(prev => 
      prev.includes(partyId) 
        ? prev.filter(id => id !== partyId)
        : [...prev, partyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La fecha de la elección es obligatoria.",
      });
      return;
    }

    const electionFormData = {
      name,
      election_date: date.toISOString().split('T')[0],
      election_type: electionType,
      scope,
      total_seats: parseInt(totalSeats) || 0,
      selectedParties
    };

    try {
      const updatedElection = await updateElection(id, electionFormData);
      if (updatedElection) {
        toast({
          title: "Elección actualizada",
          description: `Los cambios en "${name}" se han guardado correctamente.`,
        });
        navigate('/admin/elections');
      }
    } catch (error) {
      // Error handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando elección...</span>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Elección no encontrada</h2>
        <p className="text-muted-foreground mt-2">La elección que buscas no existe.</p>
        <Button asChild className="mt-4">
          <Link to="/admin/elections">Volver a Elecciones</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Editar Elección</h1>
            <p className="text-muted-foreground">
              Modifica los datos del proceso electoral.
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <Select value={electionType} onValueChange={setElectionType} required>
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
                <Select value={scope} onValueChange={setScope} required>
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
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
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
                    Modifica los partidos que participan en esta elección.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {partiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Cargando partidos políticos...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parties.map((party) => (
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
                          <p className="text-sm text-muted-foreground">{party.siglas}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedParties.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Selecciona al menos un partido político para continuar.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button asChild variant="outline">
            <Link to="/admin/elections">Cancelar</Link>
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            disabled={selectedParties.length === 0 || managementLoading || partiesLoading}
          >
            {managementLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando elección...
              </>
            ) : (
              'Actualizar Elección'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminElectionsEdit;