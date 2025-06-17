
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useIndraFileUpload } from '@/hooks/useIndraFileUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const IndraFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { uploadIndraFile, processing } = useIndraFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadIndraFile(selectedFile);
    setUploadResult(result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargar Archivo INDRA
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV o Excel con los resultados de INDRA para procesamiento automático.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indra-file">Archivo INDRA (CSV/Excel)</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="indra-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={processing}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-accent/20 rounded-lg">
            <h4 className="font-medium mb-2">Formato Esperado:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>codmun</strong>: Código del municipio</li>
              <li>• <strong>mesa</strong>: Código de mesa (ej: 01001A)</li>
              <li>• <strong>Columnas de partidos</strong>: Nombre del partido con número de votos</li>
            </ul>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando archivo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Procesar Archivo INDRA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Resultado del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.processedRows}
                </div>
                <div className="text-sm text-blue-700">Filas Procesadas</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.createdActs}
                </div>
                <div className="text-sm text-green-700">Actas Creadas</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {uploadResult.createdVotes}
                </div>
                <div className="text-sm text-purple-700">Votos Registrados</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{uploadResult.errors.length} errores encontrados:</strong>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uploadResult.errors.slice(0, 5).map((error: string, index: number) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {error}
                      </div>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... y {uploadResult.errors.length - 5} errores más
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
