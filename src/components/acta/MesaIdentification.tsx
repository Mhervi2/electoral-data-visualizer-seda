
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MpcaData, ExistingAct } from '@/types/acta';
import { MunicipalitySelector } from './MunicipalitySelector';
import { generateFullMesaIdentifier } from '@/utils/mesaIdentifierUtils';
import { FullMesaIdentifier } from '@/components/ui/mesa-identifier-display';
import { ExistingActInfoDialog } from './ExistingActInfoDialog';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface MesaIdentificationProps {
  selectedMpcaRecord: MpcaData | null;
  municipio: string;
  mesaIdentifier: string;
  onMunicipalityChange: (municipalityId: string, municipalityData: MpcaData | null) => void;
  onInputChange: (field: string, value: string) => void;
  onBlur: () => void;
  electionId?: string;
}

export const MesaIdentification = ({
  selectedMpcaRecord,
  municipio,
  mesaIdentifier,
  onMunicipalityChange,
  onInputChange,
  onBlur,
  electionId,
}: MesaIdentificationProps) => {
  const [existingAct, setExistingAct] = useState<ExistingAct | null>(null);
  const [showExistingActDialog, setShowExistingActDialog] = useState(false);
  const [checkingExistingAct, setCheckingExistingAct] = useState(false);
  const validateMesaFormat = (value: string) => {
    // Formato esperado: XX-XXX-X (distrito-sección-mesa)
    const pattern = /^\d{2}-\d{3}-[A-Z]$/;
    return pattern.test(value);
  };

  const checkExistingAct = async (fullIdentifier: string | null) => {
    if (!fullIdentifier || !electionId) return;
    
    setCheckingExistingAct(true);
    try {
      const { data, error } = await supabase
        .from('electoral_acts_with_municipalities')
        .select(`
          id,
          mesa_identifier,
          census_total,
          total_voters,
          blank_votes,
          null_votes,
          source_type,
          created_at,
          municipio,
          party_votes (
            votes,
            political_parties (
              name,
              siglas,
              color
            )
          )
        `)
        .eq('election_id', electionId)
        .or(`mesa_identifier_full.eq.${fullIdentifier},full_identifier.eq.${fullIdentifier}`)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing act:', error);
        return;
      }

      if (data) {
        const existingActData: ExistingAct = {
          id: data.id,
          mesa_identifier: data.mesa_identifier,
          census_total: data.census_total,
          total_voters: data.total_voters,
          blank_votes: data.blank_votes,
          null_votes: data.null_votes,
          source_type: data.source_type,
          created_at: data.created_at,
          municipality: { name: data.municipio },
          party_votes: data.party_votes || []
        };
        
        setExistingAct(existingActData);
        setShowExistingActDialog(true);
      }
    } catch (error) {
      console.error('Error checking existing act:', error);
    } finally {
      setCheckingExistingAct(false);
    }
  };

  const handleMesaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format district to 2 digits if needed
    const match = value.match(/^(\d{1})-(\d{3}-[A-Z])$/);
    if (match) {
      value = `0${match[1]}-${match[2]}`;
    }
    
    onInputChange('mesaIdentifier', value);
  };

  // Check for existing act when mesa identifier is complete and valid
  useEffect(() => {
    if (selectedMpcaRecord && validateMesaFormat(mesaIdentifier) && electionId) {
      const fullIdentifier = generateFullMesaIdentifier(selectedMpcaRecord, mesaIdentifier);
      if (fullIdentifier) {
        const timeoutId = setTimeout(() => {
          checkExistingAct(fullIdentifier);
        }, 500); // Debounce to avoid too many requests

        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedMpcaRecord, mesaIdentifier, electionId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identificación de la Mesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <MunicipalitySelector
              selectedMunicipalityId={municipio}
              onMunicipalitySelect={onMunicipalityChange}
            />
          </div>
          
          {selectedMpcaRecord && (
            <div className="space-y-2">
              <div>
                <Label>Provincia</Label>
                <Input 
                  value={selectedMpcaRecord.provincia} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              <div>
                <Label>Comunidad Autónoma</Label>
                <Input 
                  value={selectedMpcaRecord.ca} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mesaIdentifier">
            Identificador de Mesa *
            <span className="text-sm text-muted-foreground ml-2">
              (Formato: Distrito-Sección-Mesa, ej: 01-001-A)
            </span>
          </Label>
          <Input
            id="mesaIdentifier"
            value={mesaIdentifier}
            onChange={handleMesaChange}
            onBlur={onBlur}
            placeholder="Ej: 01-001-A"
            required
            className={!validateMesaFormat(mesaIdentifier) && mesaIdentifier ? "border-destructive" : ""}
          />
          {!validateMesaFormat(mesaIdentifier) && mesaIdentifier && (
            <p className="text-sm text-destructive">
              Formato incorrecto. Use: Distrito-Sección-Mesa (ej: 01-001-A)
            </p>
          )}
          
          {/* Show full identifier when all data is available */}
          {selectedMpcaRecord && validateMesaFormat(mesaIdentifier) && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Identificador Completo</Label>
              <div className="flex items-center gap-2">
                <FullMesaIdentifier 
                  fullIdentifier={generateFullMesaIdentifier(selectedMpcaRecord, mesaIdentifier)}
                  variant="secondary"
                  size="sm"
                />
                {checkingExistingAct && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Verificando...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Existing Act Dialog */}
      <ExistingActInfoDialog
        open={showExistingActDialog}
        onOpenChange={setShowExistingActDialog}
        existingAct={existingAct}
        electionId={electionId}
      />
    </Card>
  );
};
