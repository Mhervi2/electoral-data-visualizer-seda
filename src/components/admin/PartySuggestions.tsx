
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PartySuggestion {
  id: string;
  name: string;
  siglas: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  suggested_by: string;
}

const PartySuggestions = () => {
  const [suggestions, setSuggestions] = useState<PartySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('party_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sugerencias.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = async (id: string, action: 'approved' | 'rejected', name: string, siglas: string) => {
    try {
      if (action === 'approved') {
        // First add to political_parties table
        const { error: partyError } = await supabase
          .from('political_parties')
          .insert({
            id: siglas.toLowerCase().replace(/\s+/g, '-'),
            name,
            siglas,
            color: '#6B7280'
          });

        if (partyError) throw partyError;
      }

      // Update suggestion status
      const { error } = await supabase
        .from('party_suggestions')
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: action === 'approved' ? "Sugerencia aprobada" : "Sugerencia rechazada",
        description: `El partido "${name}" ha sido ${action === 'approved' ? 'añadido' : 'rechazado'}.`,
      });

      fetchSuggestions();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la sugerencia.",
      });
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
    return <div>Cargando sugerencias...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sugerencias de Partidos Políticos</CardTitle>
        <CardDescription>
          Gestiona las sugerencias de nuevos partidos políticos enviadas por los usuarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay sugerencias pendientes.
          </p>
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
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuggestionAction(suggestion.id, 'rejected', suggestion.name, suggestion.siglas)}
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
