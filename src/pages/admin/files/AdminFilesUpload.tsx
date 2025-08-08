
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ArrowLeft, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSecureFileUpload } from '@/hooks/useSecureFileUpload';
import { useAppData } from '@/hooks/useAppData';
import { useBatchProcessing } from '@/hooks/useBatchProcessing';
import { BatchProgress } from '@/components/ui/batch-progress';
import MunicipalityResolutionDialog from '@/components/admin/MunicipalityResolutionDialog';
import PartyResolutionDialog from '@/components/admin/PartyResolutionDialog';
import { UnresolvedMunicipality, MunicipalityResolution } from '@/hooks/useMunicipalityResolution';
import { UnresolvedParty, PartyResolution } from '@/hooks/usePartyResolution';

interface ProcessingResult {
  success: boolean;
  processedMesas: number;
  createdMesas?: number;
  updatedMesas?: number;
  createdParties: number;
  totalRows: number;
  errors: string[];
  hasMoreErrors: boolean;
  unresolvedMunicipalities?: UnresolvedMunicipality[];
  unresolvedParties?: UnresolvedParty[];
  pausedForResolution?: boolean;
}

const AdminFilesUpload = () => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useSecureFileUpload();
  const { elections, loading: electionsLoading } = useAppData();
  const { batchProgress, processFileInBatches, resetProgress } = useBatchProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [showPartyResolutionDialog, setShowPartyResolutionDialog] = useState(false);
  const [unresolvedMunicipalities, setUnresolvedMunicipalities] = useState<UnresolvedMunicipality[]>([]);
  const [unresolvedParties, setUnresolvedParties] = useState<UnresolvedParty[]>([]);
  const [pendingProcessing, setPendingProcessing] = useState<{
    file: File;
    electionId: string;
    sourceType: string;
    isRealData: boolean;
    provinceIdp?: number;
  } | null>(null);

  const [selectedSourceType, setSelectedSourceType] = useState<string>('');
  const [provinces, setProvinces] = useState<Array<{ idp: number; provincia: string; idca: number; ca: string }>>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv).",
        });
        return;
      }

      setSelectedFile(file);
      setResult(null); // Clear previous results
      resetProgress(); // Clear batch progress
    }
  };

  const processExcelFile = async (file: File, electionId: string, sourceType: string, isRealData: boolean = false, municipalityResolutions?: MunicipalityResolution[], partyResolutions?: PartyResolution[]) => {
    try {
      setProcessing(true);

      // Create FormData for the edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('electionId', electionId);
      
      // If is real-data, send 'user' so it appears in electoral results
      const effectiveSourceType = sourceType === 'real-data' ? 'user' : sourceType;
      formData.append('sourceType', effectiveSourceType);

      // Add province if available (even though this helper is mainly for non-batch)
      if (selectedProvinceId !== null && sourceType === 'real-data') {
        formData.append('provinceIdp', String(selectedProvinceId));
      }

      // Add municipality resolutions if provided
      if (municipalityResolutions && municipalityResolutions.length > 0) {
        const resolutionData = municipalityResolutions.map(resolution => ({
          originalName: resolution.originalName,
          resolvedIdm: typeof resolution.resolution === 'object' ? resolution.resolution.idm : 0
        }));
        formData.append('resolutions', JSON.stringify(resolutionData));
      }

      // Add party resolutions if provided
      if (partyResolutions && partyResolutions.length > 0) {
        const partyResolutionData = partyResolutions.map(resolution => ({
          originalName: resolution.originalName,
          resolvedPartyId: typeof resolution.resolution === 'object' ? resolution.resolution.id : resolution.resolution
        }));
        formData.append('partyResolutions', JSON.stringify(partyResolutionData));
      }

      // Call the appropriate edge function based on data type
      const functionName = isRealData ? 'process-real-data-excel' : 'process-electoral-excel';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as ProcessingResult;

    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un archivo para subir.",
      });
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const electionId = formData.get('election') as string;
    const sourceType = formData.get('sourceType') as string;

    if (!electionId || !sourceType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa todos los campos requeridos.",
      });
      return;
    }

    if (sourceType === 'real-data' && selectedProvinceId === null) {
      toast({
        variant: "destructive",
        title: "Provincia requerida",
        description: "Selecciona la provincia para los Datos Reales Excel.",
      });
      return;
    }

    try {
      console.log('Processing Excel file:', selectedFile.name);
      
      const isRealData = sourceType === 'real-data';
      
      // Use batch processing for real data, regular processing for others
      let processingResult: ProcessingResult;
      
      if (isRealData) {
        processingResult = await processFileInBatches(selectedFile, electionId, sourceType, undefined, undefined, 100, selectedProvinceId ?? undefined);
      } else {
        processingResult = await processExcelFile(selectedFile, electionId, sourceType, isRealData);
      }
      
      // Check if we need to resolve parties first (new priority)
      if (processingResult.unresolvedParties && processingResult.unresolvedParties.length > 0) {
        console.log('Found unresolved parties:', processingResult.unresolvedParties);
        setUnresolvedParties(processingResult.unresolvedParties);
        setPendingProcessing({ file: selectedFile, electionId, sourceType, isRealData, provinceIdp: selectedProvinceId ?? undefined });
        setShowPartyResolutionDialog(true);
        return;
      }
      
      // Then check if we need to resolve municipalities
      if (processingResult.unresolvedMunicipalities && processingResult.unresolvedMunicipalities.length > 0) {
        console.log('Found unresolved municipalities:', processingResult.unresolvedMunicipalities);
        setUnresolvedMunicipalities(processingResult.unresolvedMunicipalities);
        setPendingProcessing({ file: selectedFile, electionId, sourceType, isRealData, provinceIdp: selectedProvinceId ?? undefined });
        setShowResolutionDialog(true);
        return;
      }
      
      setResult(processingResult);

      if (processingResult.success) {
        const createdCount = processingResult.createdMesas || 0;
        const updatedCount = processingResult.updatedMesas || 0;
        const totalCount = createdCount + updatedCount;
        
        let description = `Se procesaron ${totalCount} mesas electorales`;
        if (createdCount > 0 && updatedCount > 0) {
          description += ` (${createdCount} nuevas, ${updatedCount} actualizadas)`;
        } else if (updatedCount > 0) {
          description += ` (${updatedCount} actualizadas)`;
        } else if (createdCount > 0) {
          description += ` (${createdCount} nuevas)`;
        }
        
        toast({
          title: "Archivo procesado correctamente",
          description: description + ".",
        });

        // Reset form after successful processing
        setSelectedFile(null);
        (e.target as HTMLFormElement).reset();
        setSelectedSourceType('');
        setSelectedProvinceId(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error en el procesamiento",
          description: "Revisa los errores mostrados abajo.",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  const handlePartyResolutions = async (resolutions: PartyResolution[]) => {
    if (!pendingProcessing) return;

    setShowPartyResolutionDialog(false);
    
    try {
      console.log('Resuming processing with party resolutions:', resolutions);
      
      let processingResult: ProcessingResult;
      
      if (pendingProcessing.isRealData) {
        processingResult = await processFileInBatches(
          pendingProcessing.file,
          pendingProcessing.electionId,
          pendingProcessing.sourceType,
          undefined, // no municipality resolutions yet
          resolutions,
          100,
          pendingProcessing.provinceIdp
        );
      } else {
        processingResult = await processExcelFile(
          pendingProcessing.file,
          pendingProcessing.electionId,
          pendingProcessing.sourceType,
          pendingProcessing.isRealData,
          undefined, // no municipality resolutions yet
          resolutions
        );
      }
      
      // Check if we still have unresolved municipalities after party resolution
      if (processingResult.unresolvedMunicipalities && processingResult.unresolvedMunicipalities.length > 0) {
        console.log('Found unresolved municipalities after party resolution:', processingResult.unresolvedMunicipalities);
        setUnresolvedMunicipalities(processingResult.unresolvedMunicipalities);
        setShowResolutionDialog(true);
        return;
      }
      
      setResult(processingResult);

      if (processingResult.success) {
        const createdCount = processingResult.createdMesas || 0;
        const updatedCount = processingResult.updatedMesas || 0;
        const totalCount = createdCount + updatedCount;
        
        let description = `Se procesaron ${totalCount} mesas electorales`;
        if (createdCount > 0 && updatedCount > 0) {
          description += ` (${createdCount} nuevas, ${updatedCount} actualizadas)`;
        } else if (updatedCount > 0) {
          description += ` (${updatedCount} actualizadas)`;
        } else if (createdCount > 0) {
          description += ` (${createdCount} nuevas)`;
        }
        
        toast({
          title: "Archivo procesado correctamente",
          description: description + ".",
        });

        // Reset form after successful processing
        setSelectedFile(null);
        setPendingProcessing(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error en el procesamiento",
          description: "Revisa los errores mostrados abajo.",
        });
      }

    } catch (error) {
      console.error('Processing error after party resolution:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setPendingProcessing(null);
    }
  };

  const handleMunicipalityResolutions = async (resolutions: MunicipalityResolution[]) => {
    if (!pendingProcessing) return;

    setShowResolutionDialog(false);
    
    try {
      console.log('Resuming processing with municipality resolutions:', resolutions);
      
      let processingResult: ProcessingResult;
      
      if (pendingProcessing.isRealData) {
        processingResult = await processFileInBatches(
          pendingProcessing.file,
          pendingProcessing.electionId,
          pendingProcessing.sourceType,
          resolutions,
          undefined,
          100,
          pendingProcessing.provinceIdp
        );
      } else {
        processingResult = await processExcelFile(
          pendingProcessing.file,
          pendingProcessing.electionId,
          pendingProcessing.sourceType,
          pendingProcessing.isRealData,
          resolutions
        );
      }
      
      setResult(processingResult);

      if (processingResult.success) {
        const createdCount = processingResult.createdMesas || 0;
        const updatedCount = processingResult.updatedMesas || 0;
        const totalCount = createdCount + updatedCount;
        
        let description = `Se procesaron ${totalCount} mesas electorales`;
        if (createdCount > 0 && updatedCount > 0) {
          description += ` (${createdCount} nuevas, ${updatedCount} actualizadas)`;
        } else if (updatedCount > 0) {
          description += ` (${updatedCount} actualizadas)`;
        } else if (createdCount > 0) {
          description += ` (${createdCount} nuevas)`;
        }
        
        toast({
          title: "Archivo procesado correctamente",
          description: description + ".",
        });

        // Reset form after successful processing
        setSelectedFile(null);
        setPendingProcessing(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error en el procesamiento",
          description: "Revisa los errores mostrados abajo.",
        });
      }

    } catch (error) {
      console.error('Processing error after municipality resolution:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setPendingProcessing(null);
    }
  };

  // Load provinces when selecting real-data source
  React.useEffect(() => {
    const loadProvinces = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-municipality-operations', {
          body: { action: 'get_provinces' },
        });
        if (error) throw error;
        if (data?.success && Array.isArray(data.data)) {
          setProvinces(data.data);
        }
      } catch (err) {
        console.error('Error loading provinces:', err);
      }
    };
    if (selectedSourceType === 'real-data' && provinces.length === 0) {
      loadProvinces();
    }
  }, [selectedSourceType]);
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk">Subir Fichero de Resultados</h1>
            <p className="text-muted-foreground">
              Sube un nuevo archivo Excel o CSV con resultados electorales.
            </p>
      </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/files">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Ficheros
          </Link>
        </Button>
      </div>

      {/* Upload Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Archivo</CardTitle>
          <CardDescription>
            Configura los detalles del archivo que vas a subir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="election">Elección Asociada *</nLabel>
              <Select name="election" required disabled={electionsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={electionsLoading ? "Cargando elecciones..." : "Selecciona la elección"} />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {elections.length === 0 && !electionsLoading && (
                <p className="text-sm text-muted-foreground text-amber-600">
                  No hay elecciones activas disponibles. Crea una elección primero.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceType">Tipo de Fuente del Fichero *</Label>
              <Select name="sourceType" required onValueChange={(v) => setSelectedSourceType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indra">INDRA</SelectItem>
                  <SelectItem value="escrutinio">Escrutinio General</SelectItem>
                  <SelectItem value="oficial">Resultado Oficial</SelectItem>
                  <SelectItem value="real-data">Datos Reales Excel</SelectItem>
                </SelectContent>
              </Select>
            {selectedSourceType === 'real-data' && (
              <div className="space-y-2">
                <Label htmlFor="province">Provincia (Datos Reales Excel) *</Label>
                <Select 
                  value={selectedProvinceId?.toString() || ''}
                  onValueChange={(v) => setSelectedProvinceId(parseInt(v))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la provincia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] z-[200]">
                    <div className="max-h-[240px] overflow-y-auto">
                      {provinces.map((p) => (
                        <SelectItem key={p.idp} value={p.idp.toString()}>
                          {p.provincia} ({p.ca})
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Filtraremos los municipios por esta provincia para evitar asociaciones incorrectas.</p>
              </div>
            )}
              <Label htmlFor="file">Archivo Excel/CSV *</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  required
                  className="flex-1"
                />
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos soportados: .xlsx, .xls, .csv (máximo 10MB)
              </p>
            </div>

            <div className="p-4 bg-accent/20 rounded-lg">
              <h4 className="font-medium mb-2">Formato del Archivo:</h4>
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las columnas: Municipio, Mesa, Censo, Votantes, Blancos, Nulos
                y una columna por cada partido político con sus respectivos votos.
              </p>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full" 
              disabled={processing || uploading || !selectedFile || elections.length === 0 || batchProgress.isProcessing}
            >
              {processing || batchProgress.isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {batchProgress.isProcessing ? 'Procesando por lotes...' : 'Procesando...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Procesar Fichero
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Batch Progress */}
      <BatchProgress
        isProcessing={batchProgress.isProcessing}
        currentBatch={batchProgress.currentBatch}
        totalBatches={batchProgress.totalBatches}
        progressPercentage={batchProgress.progressPercentage}
        processedMesas={batchProgress.processedMesas}
        totalMesas={batchProgress.totalMesas}
        errors={batchProgress.errors}
      />

      {/* Processing Results */}
      {result && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Resultado del Procesamiento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Procesadas</p>
                <p className="text-2xl font-bold text-green-600">{result.processedMesas}</p>
              </div>
              {result.createdMesas !== undefined && (
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mesas Nuevas</p>
                  <p className="text-2xl font-bold text-emerald-600">{result.createdMesas}</p>
                </div>
              )}
              {result.updatedMesas !== undefined && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mesas Actualizadas</p>
                  <p className="text-2xl font-bold text-amber-600">{result.updatedMesas}</p>
                </div>
              )}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Partidos Creados</p>
                <p className="text-2xl font-bold text-blue-600">{result.createdParties}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  Errores encontrados ({result.errors.length}):
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {result.hasMoreErrors && (
                    <li className="font-medium">... y más errores</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex space-x-2">
              <Button asChild>
                <Link to="/results">
                  Ver Resultados
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/files">
                  Volver a Ficheros
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Party Resolution Dialog - First */}
      <PartyResolutionDialog
        isOpen={showPartyResolutionDialog}
        unresolvedParties={unresolvedParties}
        onResolutionsComplete={handlePartyResolutions}
        onCancel={handleCancelResolution}
      />

      {/* Municipality Resolution Dialog - Second */}
      <MunicipalityResolutionDialog
        isOpen={showResolutionDialog}
        unresolvedMunicipalities={unresolvedMunicipalities}
        onResolutionsComplete={handleMunicipalityResolutions}
        onCancel={handleCancelResolution}
      />
    </div>
  );
};

export default AdminFilesUpload;
