import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, AlertTriangle, Users, Building, MapPin } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MunicipalityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipality: MpcaData | null;
  onSaved: () => void;
}

interface UpdateSummary {
  caUpdates: number;
  provinceUpdates: number;
  municipalityUpdates: number;
  nameUpdates: string[];
}

export const MunicipalityEditDialog: React.FC<MunicipalityEditDialogProps> = ({
  open,
  onOpenChange,
  municipality,
  onSaved
}) => {
  const { toast } = useToast();
  
  // State for form values
  const [caName, setCaName] = useState('');
  const [idca, setIdca] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [idp, setIdp] = useState('');
  const [municipalityName, setMunicipalityName] = useState('');
  const [idc, setIdc] = useState('');
  
  // State for impact analysis
  const [caImpact, setCaImpact] = useState(0);
  const [provinceImpact, setProvinceImpact] = useState(0);
  
  const [saving, setSaving] = useState(false);

  // Reset form when municipality changes
  useEffect(() => {
    if (municipality) {
      setCaName(municipality.ca);
      setIdca(municipality.idca.toString());
      setProvinceName(municipality.provincia);
      setIdp(municipality.idp.toString());
      setMunicipalityName(municipality.municipio);
      setIdc(municipality.idc || '');
    }
  }, [municipality]);

  // Calculate impact when CA name changes
  useEffect(() => {
    if (municipality && caName !== municipality.ca) {
      calculateCaImpact();
    } else {
      setCaImpact(0);
    }
  }, [caName, municipality]);

  // Calculate impact when Province name changes
  useEffect(() => {
    if (municipality && provinceName !== municipality.provincia) {
      calculateProvinceImpact();
    } else {
      setProvinceImpact(0);
    }
  }, [provinceName, municipality]);

  const calculateCaImpact = async () => {
    if (!municipality) return;
    try {
      const { count } = await supabase
        .from('mpca')
        .select('*', { count: 'exact', head: true })
        .eq('ca', municipality.ca);
      setCaImpact(count || 0);
    } catch (error) {
      console.error('Error calculating CA impact:', error);
    }
  };

  const calculateProvinceImpact = async () => {
    if (!municipality) return;
    try {
      const { count } = await supabase
        .from('mpca')
        .select('*', { count: 'exact', head: true })
        .eq('provincia', municipality.provincia);
      setProvinceImpact(count || 0);
    } catch (error) {
      console.error('Error calculating province impact:', error);
    }
  };

  const updateCaData = async (): Promise<number> => {
    if (!municipality) return 0;
    
    let updated = 0;
    
    // Update CA name if changed
    if (caName !== municipality.ca) {
      const { data, error } = await supabase.rpc('update_territorial_name', {
        p_type: 'ca',
        p_old_name: municipality.ca,
        p_new_name: caName
      });
      if (error) throw error;
      updated += data || 0;
    }
    
    // Update IDCA if changed
    const newIdca = parseInt(idca);
    if (!isNaN(newIdca) && newIdca !== municipality.idca) {
      const { data, error } = await supabase
        .from('mpca')
        .update({ idca: newIdca })
        .eq('ca', municipality.ca)
        .select('idm');
      
      if (error) throw error;
      updated += data?.length || 0;
    }
    
    return updated;
  };

  const updateProvinceData = async (): Promise<number> => {
    if (!municipality) return 0;
    
    let updated = 0;
    
    // Update province name if changed
    if (provinceName !== municipality.provincia) {
      const { data, error } = await supabase.rpc('update_territorial_name', {
        p_type: 'provincia',
        p_old_name: municipality.provincia,
        p_new_name: provinceName
      });
      if (error) throw error;
      updated += data || 0;
    }
    
    // Update IDP if changed
    const newIdp = parseInt(idp);
    if (!isNaN(newIdp) && newIdp !== municipality.idp) {
      const { data, error } = await supabase
        .from('mpca')
        .update({ idp: newIdp })
        .eq('provincia', municipality.provincia)
        .select('idm');
      
      if (error) throw error;
      updated += data?.length || 0;
    }
    
    return updated;
  };

  const updateMunicipalityData = async (): Promise<number> => {
    if (!municipality) return 0;
    
    let updated = 0;
    
    // Update municipality name if changed
    if (municipalityName !== municipality.municipio) {
      const { data, error } = await supabase.rpc('update_municipality_name', {
        p_idm: municipality.idm,
        p_new_name: municipalityName
      });
      if (error) throw error;
      updated += data || 0;
    }
    
    // Update IDC if changed
    if (idc !== (municipality.idc || '')) {
      // Validate IDC format
      if (idc && !/^\d{3}$/.test(idc)) {
        throw new Error('El IDC debe ser un número de 3 dígitos (001-999).');
      }
      
      // Check uniqueness within province
      if (idc) {
        const { data: existing } = await supabase
          .from('mpca')
          .select('idm')
          .eq('provincia', municipality.provincia)
          .eq('idc', idc)
          .neq('idm', municipality.idm)
          .single();
        
        if (existing) {
          throw new Error(`El IDC ${idc} ya existe en la provincia ${municipality.provincia}.`);
        }
      }
      
      const { error } = await supabase
        .from('mpca')
        .update({ idc: idc || null })
        .eq('idm', municipality.idm);
      
      if (error) throw error;
      updated = 1;
    }
    
    return updated;
  };

  const handleSave = async () => {
    if (!municipality) return;

    try {
      setSaving(true);
      
      const summary: UpdateSummary = {
        caUpdates: 0,
        provinceUpdates: 0,
        municipalityUpdates: 0,
        nameUpdates: []
      };

      // Update CA data (name and IDCA)
      const caUpdates = await updateCaData();
      summary.caUpdates = caUpdates;
      if (caUpdates > 0) {
        summary.nameUpdates.push(`Comunidad Autónoma: ${caUpdates} municipios`);
      }

      // Update Province data (name and IDP)
      const provinceUpdates = await updateProvinceData();
      summary.provinceUpdates = provinceUpdates;
      if (provinceUpdates > 0) {
        summary.nameUpdates.push(`Provincia: ${provinceUpdates} municipios`);
      }

      // Update Municipality data (name and IDC)
      const municipalityUpdates = await updateMunicipalityData();
      summary.municipalityUpdates = municipalityUpdates;
      if (municipalityUpdates > 0) {
        summary.nameUpdates.push(`Municipio actualizado`);
      }

      const totalUpdates = summary.caUpdates + summary.provinceUpdates + summary.municipalityUpdates;

      if (totalUpdates > 0) {
        toast({
          title: "Cambios aplicados exitosamente",
          description: summary.nameUpdates.join(', '),
        });
      } else {
        toast({
          title: "Sin cambios",
          description: "No se detectaron modificaciones.",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating municipality:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron aplicar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!municipality) return null;

  const hasChanges = 
    caName !== municipality.ca ||
    parseInt(idca) !== municipality.idca ||
    provinceName !== municipality.provincia ||
    parseInt(idp) !== municipality.idp ||
    municipalityName !== municipality.municipio ||
    idc !== (municipality.idc || '');

  const isValid = 
    caName.trim() !== '' &&
    !isNaN(parseInt(idca)) &&
    provinceName.trim() !== '' &&
    !isNaN(parseInt(idp)) &&
    municipalityName.trim() !== '' &&
    (!idc || /^\d{3}$/.test(idc));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Editar Datos Territoriales
          </AlertDialogTitle>
          <AlertDialogDescription>
            Modifica los códigos y nombres territoriales para: <strong>{municipality.municipio}</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              {municipality.provincia} - {municipality.ca}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-6">
          {/* Comunidad Autónoma */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Comunidad Autónoma
              </CardTitle>
              <CardDescription>
                Los cambios afectarán a todos los municipios de esta comunidad autónoma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caName">Nombre</Label>
                  <Input
                    id="caName"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    placeholder="Nombre de la comunidad autónoma"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idca">Código IDCA</Label>
                  <Input
                    id="idca"
                    type="number"
                    value={idca}
                    onChange={(e) => setIdca(e.target.value)}
                    placeholder="Código numérico"
                  />
                </div>
              </div>
              {caImpact > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Afectará a {caImpact} municipios
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provincia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Provincia
              </CardTitle>
              <CardDescription>
                Los cambios afectarán a todos los municipios de esta provincia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provinceName">Nombre</Label>
                  <Input
                    id="provinceName"
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                    placeholder="Nombre de la provincia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idp">Código IDP</Label>
                  <Input
                    id="idp"
                    type="number"
                    value={idp}
                    onChange={(e) => setIdp(e.target.value)}
                    placeholder="Código numérico"
                  />
                </div>
              </div>
              {provinceImpact > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Afectará a {provinceImpact} municipios
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Municipio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Municipio
              </CardTitle>
              <CardDescription>
                Los cambios afectarán solo a este municipio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="municipalityName">Nombre</Label>
                  <Input
                    id="municipalityName"
                    value={municipalityName}
                    onChange={(e) => setMunicipalityName(e.target.value)}
                    placeholder="Nombre del municipio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idc">Código IDC</Label>
                  <Input
                    id="idc"
                    value={idc}
                    onChange={(e) => setIdc(e.target.value)}
                    placeholder="001-999"
                    maxLength={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    3 dígitos, único dentro de la provincia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={saving || !hasChanges || !isValid}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};