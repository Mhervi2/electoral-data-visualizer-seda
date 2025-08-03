import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, RefreshCw, Edit3, AlertTriangle } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { useTerritorialManagement } from '@/hooks/useTerritorialManagement';
import { TerritorialEditDialog } from '@/components/admin/TerritorialEditDialog';
import { MunicipalitySearch } from '@/components/admin/MunicipalitySearch';
import { MunicipalityEditDialog } from '@/components/admin/MunicipalityEditDialog';

const TerritorialCodes = () => {
  // Use the optimized hook for territorial management
  const {
    autonomousCommunities,
    provinces,
    totalMunicipalities,
    conflicts,
    loading,
    updateTerritorialCodes,
    refetch
  } = useTerritorialManagement();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<'ca' | 'provincia'>('ca');
  const [editingName, setEditingName] = useState('');
  const [editingId, setEditingId] = useState(0);
  const [editingCount, setEditingCount] = useState(0);

  // Municipality search states
  const [municipalityDialogOpen, setMunicipalityDialogOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MpcaData | null>(null);

  const handleEditTerritory = (type: 'ca' | 'provincia', name: string, id: number, count: number) => {
    setEditingType(type);
    setEditingName(name);
    setEditingId(id);
    setEditingCount(count);
    setEditDialogOpen(true);
  };

  const handleSaveTerritory = async (newId: number) => {
    await updateTerritorialCodes(editingType, editingName, newId);
  };

  const handleEditMunicipality = (municipality: MpcaData) => {
    setSelectedMunicipality(municipality);
    setMunicipalityDialogOpen(true);
  };

  const handleMunicipalitySaved = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <MapPin className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Gestión de Códigos Territoriales</h1>
          <p className="text-muted-foreground">
            Administra los identificadores de comunidades autónomas y provincias de forma optimizada.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Comunidades Autónomas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autonomousCommunities.length}</div>
            <p className="text-xs text-muted-foreground">Regiones registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Provincias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{provinces.length}</div>
            <p className="text-xs text-muted-foreground">Provincias registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Municipios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMunicipalities}</div>
            <p className="text-xs text-muted-foreground">Total municipios</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Conflictos Detectados</span>
            </CardTitle>
            <CardDescription>
              Se encontraron códigos duplicados que necesitan revisión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index} className="text-sm text-destructive">• {conflict}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="comunidades" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comunidades">Comunidades Autónomas</TabsTrigger>
          <TabsTrigger value="provincias">Provincias</TabsTrigger>
          <TabsTrigger value="municipios">Municipios Específicos</TabsTrigger>
        </TabsList>

        <TabsContent value="comunidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Comunidades Autónomas</CardTitle>
              <CardDescription>
                Edita los códigos IDCA. Los cambios se aplicarán automáticamente a todos los municipios de la comunidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {autonomousCommunities.map((ca) => (
                  <div key={ca.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{ca.name}</div>
                       <div className="text-sm text-muted-foreground">
                        {ca.count} municipios afectados
                       </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">IDCA: {ca.id}</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditTerritory('ca', ca.name, ca.id, ca.count)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provincias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Provincias</CardTitle>
              <CardDescription>
                Edita los códigos IDP. Los cambios se aplicarán automáticamente a todos los municipios de la provincia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {provinces.map((prov) => (
                  <div key={prov.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{prov.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {prov.count} municipios afectados
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">IDP: {prov.id}</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditTerritory('provincia', prov.name, prov.id, prov.count)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="municipios" className="space-y-4">
          <MunicipalitySearch onEditMunicipality={handleEditMunicipality} />
        </TabsContent>
      </Tabs>

      {/* Territorial Edit Dialog */}
      <TerritorialEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        type={editingType}
        name={editingName}
        currentId={editingId}
        affectedCount={editingCount}
        onSave={handleSaveTerritory}
      />

      {/* Municipality Edit Dialog */}
      <MunicipalityEditDialog
        open={municipalityDialogOpen}
        onOpenChange={setMunicipalityDialogOpen}
        municipality={selectedMunicipality}
        onSaved={handleMunicipalitySaved}
      />
    </div>
  );
};

export default TerritorialCodes;