import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit3 } from 'lucide-react';
import { useSimpleMunicipalitySearch } from '@/hooks/useSimpleMunicipalitySearch';
import { MpcaData } from '@/types/acta';

interface MunicipalitySearchProps {
  onEditMunicipality: (municipality: MpcaData) => void;
}

export const MunicipalitySearch: React.FC<MunicipalitySearchProps> = ({
  onEditMunicipality
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { municipalities, loading, error, hasSearched } = useSimpleMunicipalitySearch(searchTerm, 300);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Municipio Específico</CardTitle>
        <CardDescription>
          Busca y edita códigos de municipios individuales cuando sea necesario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar municipio por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">
              Error al buscar: {error}
            </div>
          )}

          {loading && hasSearched && (
            <div className="text-sm text-muted-foreground">
              Buscando municipios...
            </div>
          )}

          {hasSearched && !loading && municipalities.length === 0 && !error && (
            <div className="text-sm text-muted-foreground">
              No se encontraron municipios con ese término.
            </div>
          )}

          {municipalities.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {municipalities.length} resultados encontrados
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {municipalities.slice(0, 50).map((municipality) => (
                  <div key={municipality.idm} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{municipality.municipio}</div>
                      <div className="text-sm text-muted-foreground">
                        {municipality.provincia} - {municipality.ca}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm space-y-1">
                        <div>IDCA: <Badge variant="outline">{municipality.idca}</Badge></div>
                        <div>IDP: <Badge variant="outline">{municipality.idp}</Badge></div>
                      </div>
                      <Button size="sm" onClick={() => onEditMunicipality(municipality)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {municipalities.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Mostrando los primeros 50 de {municipalities.length} resultados. 
                  Refina tu búsqueda para ver más.
                </p>
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Escribe al menos 2 caracteres para buscar municipios.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};