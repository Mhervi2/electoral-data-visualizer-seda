import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface BatchProgressProps {
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  progressPercentage: number;
  processedMesas: number;
  totalMesas: number;
  errors: string[];
  className?: string;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({
  isProcessing,
  currentBatch,
  totalBatches,
  progressPercentage,
  processedMesas,
  totalMesas,
  errors,
  className = ""
}) => {
  if (!isProcessing && currentBatch === 0) {
    return null;
  }

  const isComplete = !isProcessing && progressPercentage === 100;
  const hasErrors = errors.length > 0;

  return (
    <Card className={`max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span>
            {isProcessing 
              ? 'Procesando archivo por lotes...' 
              : isComplete 
                ? 'Procesamiento completado'
                : 'Procesamiento interrumpido'
            }
          </span>
        </CardTitle>
        <CardDescription>
          Procesando {totalMesas > 0 ? `${totalMesas} filas` : 'archivo'} en lotes de 100 filas para evitar timeouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso general</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Batch Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Lote Actual</p>
            <p className="text-xl font-bold text-blue-600">
              {currentBatch} / {totalBatches}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Procesadas</p>
            <p className="text-xl font-bold text-green-600">
              {processedMesas}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Filas</p>
            <p className="text-xl font-bold text-purple-600">
              {totalMesas}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Errores</p>
            <p className="text-xl font-bold text-orange-600">
              {errors.length}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2">
          {isProcessing && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Procesando lote {currentBatch} de {totalBatches}...
            </Badge>
          )}
          
          {isComplete && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✅ Todos los lotes procesados correctamente
            </Badge>
          )}
          
          {hasErrors && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              ⚠️ Se encontraron {errors.length} errores durante el procesamiento
            </Badge>
          )}
        </div>

        {/* Recent Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-medium text-red-800 text-sm mb-2">
              Errores recientes ({Math.min(errors.length, 3)} de {errors.length}):
            </h4>
            <ul className="text-xs text-red-700 space-y-1">
              {errors.slice(-3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {errors.length > 3 && (
                <li className="font-medium text-red-600">... y {errors.length - 3} errores más</li>
              )}
            </ul>
          </div>
        )}

        {/* Processing Info */}
        <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
          <p>
            <strong>Procesamiento por lotes:</strong> Se divide el archivo en lotes de 100 filas 
            para evitar timeouts de procesamiento. Cada lote se procesa independientemente, 
            lo que permite manejar archivos grandes de forma eficiente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};