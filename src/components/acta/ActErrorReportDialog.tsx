import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { ExistingAct } from '@/types/acta';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flag, Loader2 } from 'lucide-react';

interface ActErrorReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAct: ExistingAct | null;
  onReportSubmitted: () => void;
}

export const ActErrorReportDialog = ({ 
  open, 
  onOpenChange, 
  existingAct,
  onReportSubmitted 
}: ActErrorReportDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    errorTypes: [] as string[],
    observations: ''
  });

  const errorTypeOptions = [
    { id: 'mesa_identification', label: 'Error en la identificación de mesa' },
    { id: 'census_data', label: 'Error en datos de censo, votos blancos o nulos' },
    { id: 'party_votes', label: 'Error en la asignación de votos a partidos' }
  ];

  const handleErrorTypeChange = (errorTypeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      errorTypes: checked
        ? [...prev.errorTypes, errorTypeId]
        : prev.errorTypes.filter(id => id !== errorTypeId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!existingAct) return;
    
    if (formData.errorTypes.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un tipo de error",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('act_error_reports')
        .insert({
          electoral_act_id: existingAct.id,
          reporter_name: formData.reporterName || null,
          reporter_email: formData.reporterEmail || null,
          error_types: formData.errorTypes,
          observations: formData.observations || null
        });

      if (error) {
        console.error('Error submitting report:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el reporte de error",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Reporte enviado",
        description: "Su reporte de error ha sido enviado correctamente. Será revisado por un administrador."
      });

      // Reset form
      setFormData({
        reporterName: '',
        reporterEmail: '',
        errorTypes: [],
        observations: ''
      });

      onReportSubmitted();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte de error",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Flag className="h-5 w-5 mr-2 text-destructive" />
            Reportar Error en Acta
          </DialogTitle>
          <DialogDescription>
            Reporte un error en los datos de esta acta electoral. Su reporte será revisado por un administrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reporterName">Nombre (opcional)</Label>
            <Input
              id="reporterName"
              value={formData.reporterName}
              onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
              placeholder="Su nombre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterEmail">Email (opcional)</Label>
            <Input
              id="reporterEmail"
              type="email"
              value={formData.reporterEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, reporterEmail: e.target.value }))}
              placeholder="su.email@ejemplo.com"
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de error *</Label>
            {errorTypeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={formData.errorTypes.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleErrorTypeChange(option.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={option.id} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Describa el error encontrado..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Reporte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};