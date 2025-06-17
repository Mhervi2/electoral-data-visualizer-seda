
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PartySuggestion {
  id: string;
  name: string;
  siglas: string;
  status: string;
  created_at: string;
  suggested_by: string;
}

const PartySuggestions = () => {
  const [suggestions, setSuggestions] = useState<PartySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      console.log('Fetching party suggestions...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data, error } = await supabase
        .from('party_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching suggestions:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} party suggestions`);
      setSuggestions(data || []);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      
      let errorMessage = `No se pudieron cargar las sugerencias: ${error.message}`;
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: La consulta tardó demasiado tiempo';
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSuggestionAction = async (id: string, action: 'approved' | 'rejected', name: string, siglas: string) => {
    setProcessing(id);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      if (action === 'approved') {
        // Check if party already exists
        const { data: existingParty } = await supabase
          .from('political_parties')
          .select('id')
          .eq('siglas', siglas)
          .single();

        if (existingParty) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Ya existe un partido con las siglas "${siglas}".`,
          });
          return;
        }

        // Add to political_parties table
        const { error: partyError } = await supabase
          .from('political_parties')
          .insert({
            id: siglas.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name,
            siglas,
            color: '#6B7280'
          });

        if (partyError) {
          console.error('Error adding party:', partyError);
          throw partyError;
        }
      }

      // Update suggestion status
      const { error } = await supabase
        .from('party_suggestions')
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating suggestion:', error);
        throw error;
      }

      clearTimeout(timeoutId);

      toast({
        title: action === 'approved' ? "Sugerencia aprobada" : "Sugerencia rechazada",
        description: `El partido "${name}" ha sido ${action === 'approved' ? 'añadido' : 'rechazado'}.`,
      });

      // Refresh suggestions instead of reloading page
      await fetchSuggestions();
    } catch (error: any) {
      console.error('Error updating suggestion:', error);
      
      let errorMessage = `No se pudo procesar la sugerencia: ${error.message}`;
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: La operación tardó demasiado tiempo';
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando sugerencias...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sugerencias de Partidos Políticos</CardTitle>
            <CardDescription>
              Gestiona las sugerencias de nuevos partidos políticos enviadas por los usuarios.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchSuggestions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay sugerencias pendientes.
            </p>
            <Button variant="outline" onClick={fetchSuggestions} className="mt-4">
              Verificar de nuevo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Partido</TableHead>
                <TableHead>Siglas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="font-medium">{suggestion.name}</TableCell>
                  <TableCell>{suggestion.siglas}</TableCell>
                  <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                  <TableCell>{new Date(suggestion.created_at).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="text-right">
                    {suggestion.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSuggestionAction(suggestion.id, 'approved', suggestion.name, suggestion.siglas)}
                          disabled={processing === suggestion.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {processing === suggestion.id ? 'Procesando...' : 'Aprobar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuggestionAction(suggestion.id, 'rejected', suggestion.name, suggestion.siglas)}
                          disabled={processing === suggestion.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
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

export default PartySuggestions;
