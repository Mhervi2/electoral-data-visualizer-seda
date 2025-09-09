import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ActaInstructionsPanelProps {
  electionId: string;
  municipio: string;
  mesaIdentifier: string;
  imageUrl: string;
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  votos: { [key: string]: string };
  mailVoters?: any[];
  isMailVotingEnabled: boolean;
}

export const ActaInstructionsPanel: React.FC<ActaInstructionsPanelProps> = ({
  electionId,
  municipio,
  mesaIdentifier,
  imageUrl,
  censo,
  votantes,
  blancos,
  nulos,
  votos,
  mailVoters = [],
  isMailVotingEnabled
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const steps = [
    {
      id: 'election',
      title: 'Seleccionar elección',
      completed: !!electionId,
      description: 'Elige la elección correspondiente'
    },
    {
      id: 'mesa',
      title: 'Identificar mesa electoral',
      completed: !!(municipio && mesaIdentifier),
      description: 'Selecciona municipio e indica el identificador de mesa'
    },
    {
      id: 'image',
      title: 'Subir imagen del acta',
      completed: !!imageUrl,
      description: 'Fotografía o escaneo del acta original'
    },
    {
      id: 'results',
      title: 'Introducir datos de resultados',
      completed: !!(censo && votantes && blancos && nulos),
      description: 'Censo, votantes, votos en blanco y nulos'
    },
    {
      id: 'votes',
      title: 'Rellenar votos de partidos',
      completed: Object.values(votos).some(v => v && v !== '0'),
      description: 'Votos obtenidos por cada candidatura'
    },
    ...(isMailVotingEnabled ? [{
      id: 'mail',
      title: 'Votantes por correo (opcional)',
      completed: true, // Always considered complete since it's optional
      description: 'Añadir votantes por correo si corresponde'
    }] : [])
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const allCompleted = completedSteps === totalSteps;

  const getStepIcon = (completed: boolean) => {
    return completed ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="mb-6 border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>Guía para completar el acta</span>
                <Badge variant={allCompleted ? "default" : "secondary"} className="text-xs">
                  {completedSteps}/{totalSteps} completado
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {allCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Progress steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.completed)}
                        <h4 className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Important notice */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                      Importante: Completa todos los datos antes de enviar
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      El acta electoral solo se envía definitivamente cuando pulses el botón 
                      <strong> "Enviar Acta Electoral"</strong> al final del formulario. 
                      Todos los demás botones son para revisar o confirmar datos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};