import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Flag } from 'lucide-react';
import { ExistingAct } from '@/types/acta';
import { useState } from 'react';
import { ActErrorReportDialog } from './ActErrorReportDialog';

interface ExistingActInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAct: ExistingAct | null;
  electionId?: string;
}

export const ExistingActInfoDialog = ({ 
  open, 
  onOpenChange, 
  existingAct, 
  electionId 
}: ExistingActInfoDialogProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);

  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Acta de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const handleViewResults = () => {
    if (existingAct) {
      const params = new URLSearchParams();
      params.set('mesaId', existingAct.mesa_identifier);
      if (electionId) params.set('electionId', electionId);
      
      window.open(`/results?${params.toString()}`, '_blank');
    }
    onOpenChange(false);
  };

  const handleReportError = () => {
    setShowReportDialog(true);
  };

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Acta Ya Registrada
            </DialogTitle>
            <DialogDescription>
              Ya existe un acta registrada para esta mesa electoral. Puedes ver los detalles, navegar a resultados o reportar un error si consideras que los datos son incorrectos.
            </DialogDescription>
          </DialogHeader>
          {existingAct && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/20 rounded-lg">
                <h4 className="font-medium mb-3">Detalles del Acta Existente:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Municipio:</strong> {existingAct.municipality?.name}</p>
                    <p><strong>Mesa:</strong> {existingAct.mesa_identifier}</p>
                    {(() => {
                      const { district, section, table } = parseMesaIdentifier(existingAct.mesa_identifier);
                      return (
                        <>
                          <p><strong>Distrito:</strong> {district}</p>
                          <p><strong>Sección:</strong> {section}</p>
                          <p><strong>Mesa:</strong> {table}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <p><strong>Fuente:</strong> {getSourceTypeLabel(existingAct.source_type)}</p>
                    <p><strong>Fecha:</strong> {new Date(existingAct.created_at).toLocaleDateString('es-ES')}</p>
                    <p><strong>Censo:</strong> {existingAct.census_total}</p>
                    <p><strong>Votantes:</strong> {existingAct.total_voters}</p>
                    <p><strong>Blancos:</strong> {existingAct.blank_votes}</p>
                    <p><strong>Nulos:</strong> {existingAct.null_votes}</p>
                  </div>
                </div>
                
                {existingAct.party_votes && existingAct.party_votes.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">Votos por partido:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {existingAct.party_votes.map((pv: any, index: number) => (
                        <div key={index} className="flex justify-between bg-background/50 p-2 rounded">
                          <span className="font-medium">{pv.political_parties?.siglas}:</span>
                          <span>{pv.votes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleReportError}
                  className="flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Reportar Error
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cerrar
                  </Button>
                  <Button onClick={handleViewResults}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ver en Resultados
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Report Dialog */}
      <ActErrorReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        existingAct={existingAct}
        onReportSubmitted={() => {
          setShowReportDialog(false);
          onOpenChange(false);
        }}
      />
    </>
  );
};