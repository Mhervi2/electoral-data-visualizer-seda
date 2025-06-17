
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MpcaData } from '@/types/acta';
import { OptimizedMunicipalitySelector } from './OptimizedMunicipalitySelector';

interface MesaIdentificationProps {
  mpcaData: MpcaData[];
  mpcaLoading: boolean;
  mpcaError: string | null;
  selectedMpcaRecord: MpcaData | null;
  municipio: string;
  distrito: string;
  seccion: string;
  mesa: string;
  onMunicipalityChange: (municipalityId: string, municipalityData: MpcaData | null) => void;
  onInputChange: (field: string, value: string) => void;
  onBlur: () => void;
  onRetryMpca?: () => void;
}

export const MesaIdentification = ({
  mpcaData,
  mpcaLoading,
  mpcaError,
  selectedMpcaRecord,
  municipio,
  distrito,
  seccion,
  mesa,
  onMunicipalityChange,
  onInputChange,
  onBlur,
  onRetryMpca,
}: MesaIdentificationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identificación de la Mesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <OptimizedMunicipalitySelector
              mpcaData={mpcaData}
              loading={mpcaLoading}
              error={mpcaError}
              selectedMunicipalityId={municipio}
              onMunicipalitySelect={onMunicipalityChange}
              onRetry={onRetryMpca}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="distrito">Distrito *</Label>
            <Input
              id="distrito"
              value={distrito}
              onChange={(e) => onInputChange('distrito', e.target.value)}
              onBlur={onBlur}
              placeholder="Ej: 01"
              required
            />
          </div>
          <div>
            <Label htmlFor="seccion">Sección *</Label>
            <Input
              id="seccion"
              value={seccion}
              onChange={(e) => onInputChange('seccion', e.target.value)}
              onBlur={onBlur}
              placeholder="Ej: 001"
              required
            />
          </div>
          <div>
            <Label htmlFor="mesa">Mesa *</Label>
            <Input
              id="mesa"
              value={mesa}
              onChange={(e) => onInputChange('mesa', e.target.value)}
              onBlur={onBlur}
              placeholder="Ej: A"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
