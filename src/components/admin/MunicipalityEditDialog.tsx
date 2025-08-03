import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { MpcaData } from '@/types/acta';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [idca, setIdca] = useState('');
  const [idp, setIdp] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (municipality) {
      setIdca(municipality.idca.toString());
      setIdp(municipality.idp.toString());
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

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('mpca')
        .update({ idca: parsedIdca, idp: parsedIdp })
        .eq('idm', municipality.idm);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Municipio actualizado correctamente.",
      });

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
        
        <div className="space-y-4">
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
              Comunidad: {municipality.ca}
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
              Provincia: {municipality.provincia}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={saving || (idca === municipality.idca.toString() && idp === municipality.idp.toString()) || isNaN(parseInt(idca)) || isNaN(parseInt(idp))}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};