
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Image, Eye } from 'lucide-react';
import { ActDetailsDialog } from './ActDetailsDialog';
import { ElectoralAct } from '@/types/acta';
import { MesaIdentifierDisplay, FullMesaIdentifier } from '@/components/ui/mesa-identifier-display';

interface ResultsTableProps {
  electoralActs: ElectoralAct[];
}

export const ResultsTable = ({ electoralActs }: ResultsTableProps) => {
  const getSourceTypeLabel = (sourceType: string) => {
    const labels = {
      'user': 'Acta de Usuario',
      'indra': 'INDRA',
      'escrutinio': 'Escrutinio General',
      'oficial': 'Resultado Oficial'
    };
    return labels[sourceType as keyof typeof labels] || sourceType;
  };

  const getSourceTypeBadgeVariant = (sourceType: string) => {
    const variants = {
      'user': 'default',
      'indra': 'secondary',
      'escrutinio': 'outline',
      'oficial': 'destructive'
    };
    return variants[sourceType as keyof typeof variants] || 'outline';
  };

  const getLocationDisplay = (act: ElectoralAct) => {
    const municipality = act.municipio || 'N/A';
    const province = act.provincia;
    const autonomousCommunity = act.comunidad_autonoma;
    
    let location = municipality;
    if (province && province !== municipality) {
      location += ` (${province})`;
    }
    if (autonomousCommunity) {
      location += ` - ${autonomousCommunity}`;
    }
    
    return location;
  };

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actas Electorales ({electoralActs.length})</CardTitle>
        <CardDescription>
          Resultados detallados por mesa electoral
        </CardDescription>
      </CardHeader>
      <CardContent>
        {electoralActs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron actas electorales que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ubicación</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Censo</TableHead>
                <TableHead>Votantes</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {electoralActs.map((act) => {
                const { district, section, table } = parseMesaIdentifier(act.mesa_identifier);
                return (
                  <TableRow key={act.id}>
                     <TableCell>
                       <div className="text-sm">
                         <div className="font-medium">{getLocationDisplay(act)}</div>
                         <div className="text-muted-foreground">
                           D:{district} S:{section}
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         <div className="font-medium">{table}</div>
                          <MesaIdentifierDisplay
                            mesaIdentifier={act.mesa_identifier}
                            mesaIdentifierFull={act.mesa_identifier_full}
                            fullIdentifier={act.full_identifier}
                            size="sm"
                          />
                          <FullMesaIdentifier 
                            mesaIdentifierFull={act.mesa_identifier_full}
                            fullIdentifier={act.full_identifier}
                          />
                       </div>
                     </TableCell>
                    <TableCell>{act.census_total}</TableCell>
                    <TableCell>{act.total_voters}</TableCell>
                    <TableCell>
                      <Badge variant={getSourceTypeBadgeVariant(act.source_type) as any}>
                        {getSourceTypeLabel(act.source_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(act.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {act.image_url && (
                          <ActDetailsDialog act={act} />
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
