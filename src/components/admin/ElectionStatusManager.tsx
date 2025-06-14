
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, AlertTriangle } from 'lucide-react';

interface Election {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface ElectionStatusManagerProps {
  election: Election;
  onStatusChange: () => void;
}

const ElectionStatusManager = ({ election, onStatusChange }: ElectionStatusManagerProps) => {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log('Changing election status:', election.id, 'to', newStatus);
      
      const { error } = await supabase
        .from('elections')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', election.id);

      if (error) {
        console.error('Error updating election status:', error);
        throw error;
      }

      // Log audit action
      await supabase.rpc('log_audit_action', {
        p_action: 'UPDATE_ELECTION_STATUS',
        p_table_name: 'elections',
        p_record_id: election.id,
        p_old_values: { status: election.status },
        p_new_values: { status: newStatus }
      });

      toast({
        title: "Estado actualizado",
        description: `La elección "${election.name}" ahora está ${newStatus === 'active' ? 'activa' : 'cerrada'}.`,
      });

      onStatusChange();
    } catch (error) {
      console.error('Error updating election status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la elección.",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Activa' : 'Cerrada';
  };

  const getStatusVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={getStatusVariant(election.status) as any}>
        {getStatusLabel(election.status)}
      </Badge>
      
      {election.status === 'active' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('closed')}
          className="text-destructive hover:text-destructive"
        >
          <Square className="h-4 w-4 mr-1" />
          Cerrar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('active')}
          className="text-green-600 hover:text-green-600"
        >
          <Play className="h-4 w-4 mr-1" />
          Activar
        </Button>
      )}
    </div>
  );
};

export default ElectionStatusManager;
