
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { maskDniRandomly } from '@/utils/dniMask';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface MailVoter {
  id: string;
  dni: string;
  created_at: string;
}

interface MailVotersDialogProps {
  actId: string;
  mesaIdentifier: string;
}

export const MailVotersDialog = ({ actId, mesaIdentifier }: MailVotersDialogProps) => {
  const { toast } = useToast();
  const { isMailVotingEnabled } = useSystemSettings();

  // Don't render if mail voting is disabled
  if (!isMailVotingEnabled()) {
    return null;
  }
  const [mailVoters, setMailVoters] = useState<MailVoter[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchMailVoters = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      console.log('Fetching mail voters for act:', actId);
      
      const { data, error } = await supabase
        .from('mail_votes')
        .select('*')
        .eq('electoral_act_id', actId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching mail voters:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los votantes por correo.",
        });
        return;
      }

      console.log('Mail voters fetched:', data?.length || 0);
      setMailVoters(data || []);
      
    } catch (error) {
      console.error('Error fetching mail voters:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar los votantes por correo.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailVoters();
  }, [isOpen, actId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Voto por Correo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Votantes por Correo - Mesa {mesaIdentifier}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : mailVoters.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay votantes por correo registrados en esta mesa.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">
                Total votantes por correo: <span className="text-primary">{mailVoters.length}</span>
              </p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DNI</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailVoters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell className="font-mono">{maskDniRandomly(voter.dni)}</TableCell>
                    <TableCell>
                      {new Date(voter.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
