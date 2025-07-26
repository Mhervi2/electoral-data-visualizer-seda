import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClockIcon, UserIcon, FileIcon } from 'lucide-react';
import { ElectoralActAdmin, ActAuditLog } from '@/hooks/useElectoralActsAdmin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminActAuditLogProps {
  act: ElectoralActAdmin;
  auditLogs: ActAuditLog[];
}

export const AdminActAuditLog: React.FC<AdminActAuditLogProps> = ({
  act,
  auditLogs
}) => {
  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: { [key: string]: string } = {
      census_total: 'Censo Total',
      total_voters: 'Total Votantes',
      blank_votes: 'Votos en Blanco',
      null_votes: 'Votos Nulos',
      mesa_identifier: 'Identificador de Mesa',
      municipality_idm: 'Municipio'
    };
    return fieldNames[fieldName] || fieldName;
  };

  const getChangeIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'mesa_identifier':
        return <FileIcon className="h-4 w-4" />;
      case 'municipality_idm':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatValue = (fieldName: string, value: string) => {
    if (fieldName === 'municipality_idm') {
      // Could add municipality name lookup here
      return `ID: ${value}`;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Act Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Información del Acta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Mesa:</span> {act.mesa_identifier}
            </div>
            <div>
              <span className="font-medium">Municipio:</span> {act.municipio || 'Sin datos'}
            </div>
            <div>
              <span className="font-medium">Versión Actual:</span> 
              <Badge variant="secondary" className="ml-2">v{act.version}</Badge>
            </div>
            <div>
              <span className="font-medium">Última Modificación:</span> 
              {act.updated_at ? format(new Date(act.updated_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Nunca'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cambios</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cambios registrados para esta acta.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {index < auditLogs.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-8 bg-border"></div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      {getChangeIcon(log.field_name)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getFieldDisplayName(log.field_name)}
                          </span>
                          <Badge variant="outline">v{log.version}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                      
                      <div className="bg-muted/50 rounded p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Valor anterior:</span>
                            <div className="font-mono text-destructive">
                              {formatValue(log.field_name, log.old_value)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nuevo valor:</span>
                            <div className="font-mono text-green-600">
                              {formatValue(log.field_name, log.new_value)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          <UserIcon className="h-3 w-3 inline mr-1" />
                          Modificado por: Admin (ID: {log.changed_by})
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < auditLogs.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};