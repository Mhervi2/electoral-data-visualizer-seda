import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertTriangle } from 'lucide-react';

interface TerritorialEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'ca' | 'provincia';
  name: string;
  currentId: number;
  affectedCount: number;
  onSave: (newId: number, newName?: string) => Promise<void>;
}

export const TerritorialEditDialog: React.FC<TerritorialEditDialogProps> = ({
  open,
  onOpenChange,
  type,
  name,
  currentId,
  affectedCount,
  onSave
}) => {
  const [newId, setNewId] = useState(currentId.toString());
  const [newName, setNewName] = useState(name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsedId = parseInt(newId);
    if (isNaN(parsedId)) {
      return;
    }

    try {
      setSaving(true);
      const nameChanged = newName.trim() !== name;
      await onSave(parsedId, nameChanged ? newName.trim() : undefined);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent hook
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = type === 'ca' ? 'Comunidad Autónoma' : 'Provincia';
  const codeLabel = type === 'ca' ? 'IDCA' : 'IDP';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Código de {typeLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            Modifica el código {codeLabel} para: <strong>{name}</strong>
          </AlertDialogDescription>
          <div className="flex items-center space-x-2 mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Este cambio afectará a {affectedCount} municipios
            </span>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Nombre de {typeLabel}</Label>
            <Input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Nombre de ${typeLabel}`}
            />
            <p className="text-sm text-muted-foreground">
              Nombre actual: {name}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newId">Nuevo código {codeLabel}</Label>
            <Input
              id="newId"
              type="number"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder={`Código ${codeLabel}`}
            />
            <p className="text-sm text-muted-foreground">
              Código actual: {currentId}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={saving || (newId === currentId.toString() && newName.trim() === name) || isNaN(parseInt(newId))}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};