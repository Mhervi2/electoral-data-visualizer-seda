
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Image, ChevronDown } from 'lucide-react';
import { ActDetailsDialog } from './ActDetailsDialog';
import { MailVotersDialog } from './MailVotersDialog';
import { ElectoralAct } from '@/types/acta';

interface IndividualActsListProps {
  individualActas: ElectoralAct[];
  onActaClick: (acta: ElectoralAct) => void;
}

export const IndividualActsList = ({ individualActas, onActaClick }: IndividualActsListProps) => {
  const [displayCount, setDisplayCount] = useState(5);

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

  const getLocationDisplay = (acta: ElectoralAct) => {
    const municipality = acta.municipio || 'N/A';
    const province = acta.provincia;
    const autonomousCommunity = acta.comunidad_autonoma;
    
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

  const displayedActas = individualActas.slice(0, displayCount);
  const hasMore = individualActas.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const handleActaClick = (acta: ElectoralAct) => {
    onActaClick(acta);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actas Individuales ({individualActas.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {individualActas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron actas que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <>
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
                {displayedActas.map((acta) => {
                  const { district, section, table } = parseMesaIdentifier(acta.mesa_identifier);
                  return (
                    <TableRow 
                      key={acta.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleActaClick(acta)}
                    >
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{getLocationDisplay(acta)}</div>
                          <div className="text-muted-foreground">
                            D:{district} S:{section}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{table}</TableCell>
                      <TableCell>{acta.census_total}</TableCell>
                      <TableCell>{acta.total_voters}</TableCell>
                      <TableCell>
                        <Badge variant={getSourceTypeBadgeVariant(acta.source_type) as any}>
                          {getSourceTypeLabel(acta.source_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(acta.created_at).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          {acta.image_url ? (
                            <ActDetailsDialog act={acta} />
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              <Image className="h-4 w-4" />
                            </Button>
                          )}
                          <MailVotersDialog 
                            actId={acta.id} 
                            mesaIdentifier={acta.mesa_identifier}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  className="flex items-center gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  Ver más actas (mostrar {Math.min(5, individualActas.length - displayCount)} más)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
