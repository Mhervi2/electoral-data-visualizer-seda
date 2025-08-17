import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ValidationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: string[];
  onContinue: () => void;
  onCancel: () => void;
}

export const ValidationWarningDialog: React.FC<ValidationWarningDialogProps> = ({
  open,
  onOpenChange,
  warnings,
  onContinue,
  onCancel
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Discrepancias Detectadas
          </AlertDialogTitle>
          <AlertDialogDescription>
            Se han encontrado las siguientes discrepancias en los datos del acta:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          {warnings.map((warning, index) => (
            <Alert key={index} variant="destructive">
              <AlertDescription className="text-sm">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            Volver a Revisar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue} className="w-full sm:w-auto">
            Guardar de Todos Modos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};