import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, MapPin, Save, RefreshCw } from 'lucide-react';
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

  const handleEdit = (record: TerritorialRecord) => {
    setEditingRecord(record);
    setTempIdca(record.idca.toString());
    setTempIdp(record.idp.toString());
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

      const { error } = await supabase
        .from('mpca')
        .update({ 
          idca: idca,
          idp: idp 
        })
        .eq('idm', editingRecord.idm);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Códigos territoriales actualizados correctamente.",
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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Territorios</CardTitle>
          <CardDescription>
            Busca por municipio, provincia o comunidad autónoma para editar sus códigos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar territorio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autonomous Communities Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Comunidades Autónomas</CardTitle>
            <CardDescription>Códigos IDCA asignados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {autonomousCommunities.slice(0, 10).map((ca) => (
              <div key={ca.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{ca.name}</span>
                  <Badge variant="outline">{ca.count} provincias</Badge>
                </div>
                <Badge>{ca.id}</Badge>
              </div>
            ))}
            {autonomousCommunities.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Y {autonomousCommunities.length - 10} más...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Provinces Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Provincias</CardTitle>
            <CardDescription>Códigos IDP asignados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {provinces.slice(0, 10).map((prov) => (
              <div key={prov.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prov.name}</span>
                  <Badge variant="outline">{prov.count} municipios</Badge>
                </div>
                <Badge>{prov.id}</Badge>
              </div>
            ))}
            {provinces.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Y {provinces.length - 10} más...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
            <CardDescription>
              {filteredRecords.length} resultados encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecords.slice(0, 20).map((record) => (
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
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
              {filteredRecords.length > 20 && (
                <p className="text-sm text-muted-foreground text-center">
                  Y {filteredRecords.length - 20} resultados más. Refina tu búsqueda para ver más.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <AlertDialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Códigos Territoriales</AlertDialogTitle>
            <AlertDialogDescription>
              Modifica los códigos IDCA e IDP para: <strong>{editingRecord?.municipio}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {editingRecord && (
            <div className="space-y-4">
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