
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Image, Eye } from 'lucide-react';
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
  party_votes?: { 
    party: { 
      name: string; 
      siglas: string; 
      color: string; 
    }; 
    votes: number; 
  }[];
}

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
              {electoralActs.map((act) => (
                <TableRow key={act.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{getLocationDisplay(act)}</div>
                      <div className="text-muted-foreground">
                        D:{act.district} S:{act.section}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{act.table_letter}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
