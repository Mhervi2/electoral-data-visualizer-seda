import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { useTerritorialManagement } from '@/hooks/useTerritorialManagement';
import { MunicipalitySearch } from '@/components/admin/MunicipalitySearch';
import { MunicipalityEditDialog } from '@/components/admin/MunicipalityEditDialog';

const TerritorialCodes = () => {
  console.log('🔍 TerritorialCodes component loading...');
  
  // Use the optimized hook for territorial management
  const territorialData = useTerritorialManagement();
  console.log('🔍 Territorial data:', territorialData);
  
  const {
    totalMunicipalities,
    conflicts,
    loading,
    refetch
  } = territorialData;

  // Municipality search states
  const [municipalityDialogOpen, setMunicipalityDialogOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MpcaData | null>(null);

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
            Administra los identificadores de comunidades autónomas y provincias de forma optimizada. (v2)
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Municipios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMunicipalities}</div>
          <p className="text-xs text-muted-foreground">Total municipios</p>
        </CardContent>
      </Card>

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

      {/* Main Content */}
      <MunicipalitySearch onEditMunicipality={handleEditMunicipality} />

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