
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
  error?: string | null;
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
  loading = false,
  error = null
}: MesaIdentificationProps) => {
  console.log('MesaIdentification render - loading:', loading, 'error:', error, 'mpcaData length:', mpcaData.length);
  
  const getStatusInfo = () => {
    if (loading) {
      return {
        message: "Cargando municipios desde la base de datos...",
        color: "text-blue-600",
        isError: false
      };
    }
    
    if (error || (!loading && mpcaData.length === 0)) {
      return {
        message: error || "⚠️ No se encontraron municipios. Es posible que falten permisos (RLS) en la tabla 'mpca' de Supabase.",
        color: "text-red-600",
        isError: true
      };
    }
    
    return {
      message: `✅ ${mpcaData.length} municipios cargados correctamente`,
      color: "text-green-600",
      isError: false
    };
  };
  
  const statusInfo = getStatusInfo();
  
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
              placeholder={loading ? "Cargando..." : "Buscar municipio..."}
            />
            <p className={`text-sm mt-2 p-2 rounded ${statusInfo.color} ${statusInfo.isError ? 'bg-red-50' : 'bg-green-50'}`}>
              {statusInfo.message}
            </p>
            {!loading && !statusInfo.isError && (
              <p className="text-xs text-gray-500 mt-1">
                Escribe para buscar por municipio, provincia o C.A.
              </p>
            )}
            {statusInfo.isError && (
              <p className="text-xs text-red-600 mt-1">
                Revisa la consola del navegador para más detalles del error.
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
