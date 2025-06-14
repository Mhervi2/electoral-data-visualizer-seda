
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MpcaData } from '@/types/acta';

interface MesaIdentificationProps {
  mpcaData: MpcaData[];
  selectedMpcaRecord: MpcaData | null;
  municipio: string;
  distrito: string;
  seccion: string;
  mesa: string;
  onMunicipalityChange: (value: string) => void;
  onInputChange: (field: string, value: string) => void;
  onBlur: () => void;
}

export const MesaIdentification = ({
  mpcaData,
  selectedMpcaRecord,
  municipio,
  distrito,
  seccion,
  mesa,
  onMunicipalityChange,
  onInputChange,
  onBlur
}: MesaIdentificationProps) => {
  console.log('MesaIdentification - mpcaData length:', mpcaData.length);
  console.log('MesaIdentification - selected municipio:', municipio);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identificación de la Mesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="municipio">Municipio *</Label>
            <Select value={municipio} onValueChange={onMunicipalityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar municipio" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {mpcaData.length === 0 ? (
                  <SelectItem value="loading" disabled>Cargando municipios...</SelectItem>
                ) : (
                  mpcaData.map(mpca => (
                    <SelectItem key={mpca.idm} value={mpca.idm.toString()}>
                      {mpca.municipio}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {mpcaData.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {mpcaData.length === 0 ? 'Cargando municipios...' : `${mpcaData.length} municipios disponibles`}
              </p>
            )}
          </div>
          
          {selectedMpcaRecord && (
            <div className="space-y-2">
              <div>
                <Label>Provincia</Label>
                <Input value={selectedMpcaRecord.provincia} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Comunidad Autónoma</Label>
                <Input value={selectedMpcaRecord.ca} disabled className="bg-muted" />
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
