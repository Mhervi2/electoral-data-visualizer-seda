
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MpcaData } from '@/types/acta';
import { MunicipalityCombobox } from './MunicipalityCombobox';

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
  loading?: boolean;
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
  onBlur,
  loading = false
}: MesaIdentificationProps) => {
  console.log('=== MESA IDENTIFICATION RENDER ===');
  console.log('MesaIdentification - mpcaData length:', mpcaData.length);
  console.log('MesaIdentification - selected municipio:', municipio);
  console.log('MesaIdentification - loading:', loading);
  console.log('MesaIdentification - selectedMpcaRecord:', selectedMpcaRecord);
  
  // Check if Barcelona exists in the data
  const barcelonaTest = mpcaData.find(m => m.municipio?.toLowerCase().includes('barcelona'));
  console.log('Barcelona test in MesaIdentification:', barcelonaTest);
  
  // Show detailed status
  const getStatusMessage = () => {
    if (loading) {
      return "Cargando municipios...";
    }
    if (mpcaData.length === 0) {
      return "Error al cargar municipios. Revisa la conexión.";
    }
    return `${mpcaData.length} municipios cargados`;
  };
  
  const getStatusColor = () => {
    if (loading) return "text-blue-600";
    if (mpcaData.length === 0) return "text-red-600";
    return "text-green-600";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identificación de la Mesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="municipio">Municipio *</Label>
            <MunicipalityCombobox 
              mpcaData={mpcaData}
              selectedValue={municipio}
              onSelect={onMunicipalityChange}
              placeholder={loading ? "Cargando municipios..." : "Buscar municipio..."}
            />
            <p className={`text-sm mt-1 ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
            {mpcaData.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Escribe para buscar municipios (ej: "barcelona", "madrid")
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
