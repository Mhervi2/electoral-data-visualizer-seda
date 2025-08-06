
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MpcaData } from '@/types/acta';
import { MunicipalitySelector } from './MunicipalitySelector';
import { generateFullMesaIdentifier } from '@/utils/mesaIdentifierUtils';
import { FullMesaIdentifier } from '@/components/ui/mesa-identifier-display';

interface MesaIdentificationProps {
  selectedMpcaRecord: MpcaData | null;
  municipio: string;
  mesaIdentifier: string;
  onMunicipalityChange: (municipalityId: string, municipalityData: MpcaData | null) => void;
  onInputChange: (field: string, value: string) => void;
  onBlur: () => void;
}

export const MesaIdentification = ({
  selectedMpcaRecord,
  municipio,
  mesaIdentifier,
  onMunicipalityChange,
  onInputChange,
  onBlur,
}: MesaIdentificationProps) => {
  const validateMesaFormat = (value: string) => {
    // Formato esperado: XX-XXX-X (distrito-sección-mesa)
    const pattern = /^\d{2}-\d{3}-[A-Z]$/;
    return pattern.test(value);
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
              <FullMesaIdentifier 
                fullIdentifier={generateFullMesaIdentifier(selectedMpcaRecord, mesaIdentifier)}
                variant="secondary"
                size="sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
