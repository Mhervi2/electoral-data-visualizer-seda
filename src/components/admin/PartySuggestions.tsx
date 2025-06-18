
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const PartySuggestions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugerencias de Partidos Políticos</CardTitle>
        <CardDescription>
          Gestión de sugerencias de nuevos partidos políticos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            La funcionalidad de sugerencias de partidos políticos no está disponible en esta versión simplificada del sistema. 
            Los partidos pueden ser gestionados directamente por los administradores.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PartySuggestions;
