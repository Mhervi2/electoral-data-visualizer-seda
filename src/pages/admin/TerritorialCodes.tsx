import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, MapPin, Save, RefreshCw, Edit3, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MpcaData } from '@/types/acta';

interface TerritorialRecord extends MpcaData {
  id: string;
}

const TerritorialCodes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<TerritorialRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TerritorialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<TerritorialRecord | null>(null);
  const [editingType, setEditingType] = useState<'ca' | 'provincia' | 'municipio'>('municipio');
  const [editingTarget, setEditingTarget] = useState<string>('');
  const [tempIdca, setTempIdca] = useState('');
  const [tempIdp, setTempIdp] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const filtered = records.filter(record =>
      record.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.provincia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.ca.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
  }, [searchTerm, records]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mpca')
        .select('*')
        .order('ca', { ascending: true })
        .order('provincia', { ascending: true })
        .order('municipio', { ascending: true });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los códigos territoriales.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: TerritorialRecord, type: 'ca' | 'provincia' | 'municipio' = 'municipio') => {
    setEditingRecord(record);
    setEditingType(type);
    setEditingTarget(type === 'ca' ? record.ca : type === 'provincia' ? record.provincia : record.municipio);
    setTempIdca(record.idca.toString());
    setTempIdp(record.idp.toString());
  };

  const handleEditCA = (ca: string, idca: number) => {
    const sampleRecord = records.find(r => r.ca === ca);
    if (sampleRecord) {
      handleEdit({ ...sampleRecord, idca }, 'ca');
    }
  };

  const handleEditProvincia = (provincia: string, idp: number) => {
    const sampleRecord = records.find(r => r.provincia === provincia);
    if (sampleRecord) {
      handleEdit({ ...sampleRecord, idp }, 'provincia');
    }
  };

  const handleSave = async () => {
    if (!editingRecord) return;

    try {
      const idca = parseInt(tempIdca);
      const idp = parseInt(tempIdp);

      if (isNaN(idca) || isNaN(idp)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Los códigos deben ser números válidos.",
        });
        return;
      }

      let updateQuery;

      if (editingType === 'ca') {
        updateQuery = supabase.from('mpca').update({ idca }).eq('ca', editingTarget);
      } else if (editingType === 'provincia') {
        updateQuery = supabase.from('mpca').update({ idp }).eq('provincia', editingTarget);
      } else {
        updateQuery = supabase.from('mpca').update({ idca, idp }).eq('idm', editingRecord.idm);
      }

      const { error } = await updateQuery;

      if (error) throw error;

      const recordsAffected = editingType === 'ca' 
        ? records.filter(r => r.ca === editingTarget).length
        : editingType === 'provincia'
        ? records.filter(r => r.provincia === editingTarget).length
        : 1;

      toast({
        title: "Éxito",
        description: `${recordsAffected} registro(s) actualizado(s) correctamente.`,
      });

      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los códigos territoriales.",
      });
    }
  };

  const getConflicts = () => {
    const idcaConflicts = new Map();
    const idpConflicts = new Map();

    records.forEach(record => {
      // Check IDCA conflicts
      if (!idcaConflicts.has(record.idca)) {
        idcaConflicts.set(record.idca, new Set());
      }
      idcaConflicts.get(record.idca).add(record.ca);

      // Check IDP conflicts  
      if (!idpConflicts.has(record.idp)) {
        idpConflicts.set(record.idp, new Set());
      }
      idpConflicts.get(record.idp).add(record.provincia);
    });

    const conflicts = [];
    idcaConflicts.forEach((communities, idca) => {
      if (communities.size > 1) {
        conflicts.push(`IDCA ${idca}: ${Array.from(communities).join(', ')}`);
      }
    });

    idpConflicts.forEach((provinces, idp) => {
      if (provinces.size > 1) {
        conflicts.push(`IDP ${idp}: ${Array.from(provinces).join(', ')}`);
      }
    });

    return conflicts;
  };

  const getUniqueItems = (items: TerritorialRecord[], key: keyof TerritorialRecord, idKey: 'idca' | 'idp') => {
    const unique = new Map();
    items.forEach(item => {
      const value = item[key] as string;
      const id = item[idKey];
      if (!unique.has(value)) {
        unique.set(value, { name: value, id, count: 0 });
      }
      unique.get(value).count++;
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const autonomousCommunities = getUniqueItems(records, 'ca', 'idca');
  const provinces = getUniqueItems(records, 'provincia', 'idp');
  const conflicts = getConflicts();

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
            Administra los identificadores de comunidades autónomas y provincias.
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
            <div className="text-2xl font-bold">{records.length}</div>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comunidades">Comunidades Autónomas</TabsTrigger>
          <TabsTrigger value="provincias">Provincias</TabsTrigger>
          <TabsTrigger value="municipios">Municipios</TabsTrigger>
          <TabsTrigger value="buscar">Buscar</TabsTrigger>
        </TabsList>

        <TabsContent value="comunidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Comunidades Autónomas</CardTitle>
              <CardDescription>
                Edita los códigos IDCA. Los cambios se aplicarán a todos los municipios de la comunidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {autonomousCommunities.map((ca) => (
                  <div key={ca.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{ca.name}</div>
                       <div className="text-sm text-muted-foreground">
                        {ca.count} municipios
                       </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">IDCA: {ca.id}</Badge>
                      <Button size="sm" onClick={() => handleEditCA(ca.name, ca.id)}>
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
                Edita los códigos IDP. Los cambios se aplicarán a todos los municipios de la provincia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {provinces.map((prov) => (
                  <div key={prov.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{prov.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {prov.count} municipios
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">IDP: {prov.id}</Badge>
                      <Button size="sm" onClick={() => handleEditProvincia(prov.name, prov.id)}>
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
          <Card>
            <CardHeader>
              <CardTitle>Todos los Municipios</CardTitle>
              <CardDescription>
                Listado completo de municipios con sus códigos territoriales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <div key={record.idm} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{record.municipio}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.provincia} - {record.ca}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm space-y-1">
                        <div>IDCA: <Badge variant="outline">{record.idca}</Badge></div>
                        <div>IDP: <Badge variant="outline">{record.idp}</Badge></div>
                      </div>
                      <Button size="sm" onClick={() => handleEdit(record)}>
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

        <TabsContent value="buscar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Territorios</CardTitle>
              <CardDescription>
                Busca por municipio, provincia o comunidad autónoma para editar sus códigos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar territorio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchTerm && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {filteredRecords.length} resultados encontrados
                  </div>
                  {filteredRecords.slice(0, 50).map((record) => (
                    <div key={record.idm} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{record.municipio}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.provincia} - {record.ca}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm">
                          <div>IDCA: <Badge variant="outline">{record.idca}</Badge></div>
                          <div>IDP: <Badge variant="outline">{record.idp}</Badge></div>
                        </div>
                        <Button size="sm" onClick={() => handleEdit(record)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredRecords.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Mostrando los primeros 50 de {filteredRecords.length} resultados. Refina tu búsqueda para ver más.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Edit Dialog */}
      <AlertDialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Códigos Territoriales</AlertDialogTitle>
            <AlertDialogDescription>
              {editingType === 'ca' && `Modifica el código IDCA para toda la comunidad autónoma: ${editingTarget}`}
              {editingType === 'provincia' && `Modifica el código IDP para toda la provincia: ${editingTarget}`}
              {editingType === 'municipio' && `Modifica los códigos para el municipio: ${editingRecord?.municipio}`}
              {editingType !== 'municipio' && (
                <div className="mt-2 text-sm font-medium text-orange-600">
                  ⚠️ Este cambio afectará a {editingType === 'ca' 
                    ? records.filter(r => r.ca === editingTarget).length
                    : records.filter(r => r.provincia === editingTarget).length
                  } municipios
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {editingRecord && (
            <div className="space-y-4">
              {(editingType === 'ca' || editingType === 'municipio') && (
                <div className="space-y-2">
                  <Label htmlFor="idca">Código Comunidad Autónoma (IDCA)</Label>
                  <Input
                    id="idca"
                    value={tempIdca}
                    onChange={(e) => setTempIdca(e.target.value)}
                    placeholder="Ej: 12"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comunidad: {editingRecord.ca}
                  </p>
                </div>
              )}
              
              {(editingType === 'provincia' || editingType === 'municipio') && (
                <div className="space-y-2">
                  <Label htmlFor="idp">Código Provincia (IDP)</Label>
                  <Input
                    id="idp"
                    value={tempIdp}
                    onChange={(e) => setTempIdp(e.target.value)}
                    placeholder="Ej: 28"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provincia: {editingRecord.provincia}
                  </p>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TerritorialCodes;