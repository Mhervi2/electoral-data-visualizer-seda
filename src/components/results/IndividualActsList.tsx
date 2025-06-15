
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Image, ChevronDown } from 'lucide-react';
import { ActDetailsDialog } from './ActDetailsDialog';

interface ElectoralAct {
  id: string;
  municipality_idm: number;
  district: string;
  section: string;
  table_letter: string;
  census_total: number;
  total_voters: number;
  blank_votes: number;
  null_votes: number;
  source_type: string;
  image_url?: string;
  created_at: string;
  municipio?: string;
  provincia?: string;
  comunidad_autonoma?: string;
}

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
                  <TableHead className="text-right">Imagen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedActas.map((acta) => (
                  <TableRow 
                    key={acta.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => handleActaClick(acta)}
                  >
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getLocationDisplay(acta)}</div>
                        <div className="text-muted-foreground">
                          D:{acta.district} S:{acta.section}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{acta.table_letter}</TableCell>
                    <TableCell>{acta.census_total}</TableCell>
                    <TableCell>{acta.total_voters}</TableCell>
                    <TableCell>
                      <Badge variant={getSourceTypeBadgeVariant(acta.source_type) as any}>
                        {getSourceTypeLabel(acta.source_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(acta.created_at).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell className="text-right">
                      {acta.image_url ? (
                        <ActDetailsDialog act={acta} />
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Image className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
