
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ExistingAct } from '@/types/acta';

interface ExistingActDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAct: ExistingAct | null;
}

export const ExistingActDialog = ({ open, onOpenChange, existingAct }: ExistingActDialogProps) => {
  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Acta de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Acta Ya Registrada
          </DialogTitle>
          <DialogDescription>
            Ya existe un acta registrada para esta mesa electoral. Revise los detalles a continuación.
          </DialogDescription>
        </DialogHeader>
        {existingAct && (
          <div className="space-y-4">
            <div className="p-4 bg-accent/20 rounded-lg">
              <h4 className="font-medium mb-3">Detalles del Acta Existente:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Municipio:</strong> {existingAct.municipality?.name}</p>
                  <p><strong>Distrito:</strong> {existingAct.district}</p>
                  <p><strong>Sección:</strong> {existingAct.section}</p>
                  <p><strong>Mesa:</strong> {existingAct.table_letter}</p>
                </div>
                <div>
                  <p><strong>Fuente:</strong> {getSourceTypeLabel(existingAct.source_type)}</p>
                  <p><strong>Fecha:</strong> {new Date(existingAct.created_at).toLocaleDateString('es-ES')}</p>
                  <p><strong>Censo:</strong> {existingAct.census_total}</p>
                  <p><strong>Votantes:</strong> {existingAct.total_voters}</p>
                </div>
              </div>
              
              {existingAct.party_votes && existingAct.party_votes.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Votos por partido:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {existingAct.party_votes.map((pv: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{pv.political_parties?.siglas}:</span>
                        <span>{pv.votes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Entendido
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
