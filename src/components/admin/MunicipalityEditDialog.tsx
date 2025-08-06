import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, AlertTriangle } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTerritorialManagement } from '@/hooks/useTerritorialManagement';

interface MunicipalityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipality: MpcaData | null;
  onSaved: () => void;
}

export const MunicipalityEditDialog: React.FC<MunicipalityEditDialogProps> = ({
  open,
  onOpenChange,
  municipality,
  onSaved
}) => {
  const { toast } = useToast();
  const { updateTerritorialName, updateMunicipalityName } = useTerritorialManagement();
  
  const [idca, setIdca] = useState('');
  const [idp, setIdp] = useState('');
  const [idc, setIdc] = useState('');
  const [municipalityName, setMunicipalityName] = useState('');
  const [caName, setCaName] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (municipality) {
      setIdca(municipality.idca.toString());
      setIdp(municipality.idp.toString());
      setIdc(municipality.idc || '');
      setMunicipalityName(municipality.municipio);
      setCaName(municipality.ca);
      setProvinceName(municipality.provincia);
    }
  }, [municipality]);

  const handleSave = async () => {
    if (!municipality) return;

    const parsedIdca = parseInt(idca);
    const parsedIdp = parseInt(idp);

    if (isNaN(parsedIdca) || isNaN(parsedIdp)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Los códigos deben ser números válidos.",
      });
      return;
    }

    // Validate IDC format (3 digits)
    if (idc && (!/^\d{3}$/.test(idc))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El IDC debe ser un número de 3 dígitos (001-999).",
      });
      return;
    }

    try {
      setSaving(true);
      
      let hasChanges = false;

      // Update codes if they changed
      if (parsedIdca !== municipality.idca || parsedIdp !== municipality.idp || idc !== municipality.idc) {
        // Check if IDC is unique within the province when changing it
        if (idc !== municipality.idc && idc) {
          const { data: existingIdc } = await supabase
            .from('mpca')
            .select('idm')
            .eq('provincia', municipality.provincia)
            .eq('idc', idc)
            .neq('idm', municipality.idm)
            .single();

          if (existingIdc) {
            toast({
              variant: "destructive",
              title: "Error",
              description: `El IDC ${idc} ya existe en la provincia ${municipality.provincia}.`,
            });
            return;
          }
        }

        const updateData: any = { idca: parsedIdca, idp: parsedIdp };
        if (idc) updateData.idc = idc;

        const { error } = await supabase
          .from('mpca')
          .update(updateData)
          .eq('idm', municipality.idm);

        if (error) throw error;
        hasChanges = true;
      }

      // Update municipality name if it changed
      if (municipalityName !== municipality.municipio) {
        await updateMunicipalityName(municipality.idm, municipalityName);
        hasChanges = true;
      }

      // Update CA name if it changed (propagates to all municipalities in that CA)
      if (caName !== municipality.ca) {
        await updateTerritorialName('ca', municipality.ca, caName);
        hasChanges = true;
      }

      // Update province name if it changed (propagates to all municipalities in that province)
      if (provinceName !== municipality.provincia) {
        await updateTerritorialName('provincia', municipality.provincia, provinceName);
        hasChanges = true;
      }

      if (hasChanges) {
        toast({
          title: "Éxito",
          description: "Cambios aplicados correctamente.",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating municipality:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el municipio.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!municipality) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Municipio</AlertDialogTitle>
          <AlertDialogDescription>
            Modifica los códigos territoriales para: <strong>{municipality.municipio}</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              {municipality.provincia} - {municipality.ca}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-6">
          {/* Sección de nombres territoriales */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Nombres Territoriales</h4>
            
            <div className="space-y-2">
              <Label htmlFor="municipalityName">Nombre del Municipio</Label>
              <Input
                id="municipalityName"
                value={municipalityName}
                onChange={(e) => setMunicipalityName(e.target.value)}
                placeholder="Nombre del municipio"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caName">Nombre de la Comunidad Autónoma</Label>
              <Input
                id="caName"
                value={caName}
                onChange={(e) => setCaName(e.target.value)}
                placeholder="Nombre de la comunidad autónoma"
              />
              {caName !== municipality?.ca && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Este cambio afectará a todos los municipios de {municipality?.ca}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provinceName">Nombre de la Provincia</Label>
              <Input
                id="provinceName"
                value={provinceName}
                onChange={(e) => setProvinceName(e.target.value)}
                placeholder="Nombre de la provincia"
              />
              {provinceName !== municipality?.provincia && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Este cambio afectará a todos los municipios de {municipality?.provincia}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          {/* Sección de códigos territoriales */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Códigos Territoriales</h4>
            
            <div className="space-y-2">
              <Label htmlFor="idca">Código Comunidad Autónoma (IDCA)</Label>
              <Input
                id="idca"
                type="number"
                value={idca}
                onChange={(e) => setIdca(e.target.value)}
                placeholder="Código IDCA"
              />
              <p className="text-sm text-muted-foreground">
                Comunidad: {caName}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idp">Código Provincia (IDP)</Label>
              <Input
                id="idp"
                type="number"
                value={idp}
                onChange={(e) => setIdp(e.target.value)}
                placeholder="Código IDP"
              />
              <p className="text-sm text-muted-foreground">
                Provincia: {provinceName}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idc">Identificación de Circunscripción (IDC)</Label>
              <Input
                id="idc"
                value={idc}
                onChange={(e) => setIdc(e.target.value)}
                placeholder="001"
                maxLength={3}
              />
              <p className="text-sm text-muted-foreground">
                Identificador único del municipio dentro de la provincia (001-999)
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={saving || (
              idca === municipality?.idca.toString() && 
              idp === municipality?.idp.toString() && 
              idc === (municipality?.idc || '') &&
              municipalityName === municipality?.municipio &&
              caName === municipality?.ca &&
              provinceName === municipality?.provincia
            ) || isNaN(parseInt(idca)) || isNaN(parseInt(idp)) || (idc && !/^\d{3}$/.test(idc))}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};