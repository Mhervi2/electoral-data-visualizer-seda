
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData';
import PartySuggestions from '@/components/admin/PartySuggestions';
import CreatePartyDialog from '@/components/admin/CreatePartyDialog';
import EditPartyDialog from '@/components/admin/EditPartyDialog';

const PoliticalParties = () => {
  const { politicalParties, loading, error } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');

  const handlePartyChange = () => {
    window.location.reload();
  };

  const filteredParties = politicalParties.filter(party =>
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.siglas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error de Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
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
            {politicalParties.length} partidos disponibles para el proceso electoral
          </p>
        </div>
        <CreatePartyDialog onPartyCreated={handlePartyChange} />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Participante activo</span>
                </div>
                <EditPartyDialog party={party} onPartyUpdated={handlePartyChange} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParties.length === 0 && politicalParties.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No se encontraron partidos que coincidan con tu búsqueda.
            </p>
          </CardContent>
        </Card>
      )}

      {politicalParties.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No hay partidos políticos disponibles en este momento.
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
            En esta versión simplificada, los partidos se gestionan directamente en la base de datos.
          </p>
        </CardContent>
      </Card>

      {/* Party Suggestions Section */}
      <PartySuggestions />
    </div>
  );
};

export default PoliticalParties;
