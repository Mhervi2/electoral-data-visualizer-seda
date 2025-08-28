import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PoliticalPartyForm, { PoliticalPartyFormData } from './PoliticalPartyForm';
import { usePoliticalPartiesManagement, type PoliticalPartyData } from '@/hooks/usePoliticalPartiesManagement';
import { ProvinceManagement } from './ProvinceManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PoliticalParty {
  id: string;
  name: string;
  siglas: string;
  color: string;
}

interface EditPartyDialogProps {
  party: PoliticalParty;
  onPartyUpdated?: () => void;
}

const EditPartyDialog: React.FC<EditPartyDialogProps> = ({ party, onPartyUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateParty, isUpdating } = usePoliticalPartiesManagement();
  const { toast } = useToast();

  const handleSubmit = async (data: PoliticalPartyFormData) => {
    const partyData: PoliticalPartyData = {
      name: data.name,
      siglas: data.siglas,
      color: data.color,
    };
    const success = await updateParty(party.id, partyData);
    if (success) {
      setIsOpen(false);
      onPartyUpdated?.();
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      console.log('🗑️ Iniciando eliminación del partido:', party.id);

      // Paso 1: Eliminar votos de partido
      console.log('🗳️ Eliminando votos del partido...');
      const { error: partyVotesError } = await supabase
        .from('party_votes')
        .delete()
        .eq('party_id', party.id);

      if (partyVotesError) {
        console.error('❌ Error eliminando votos del partido:', partyVotesError);
        throw new Error('Error eliminando votos del partido');
      }
      console.log('✅ Votos del partido eliminados');

      // Paso 2: Eliminar disponibilidad por provincia
      console.log('🏛️ Eliminando disponibilidad por provincia...');
      const { error: partyProvincesError } = await supabase
        .from('party_provinces')
        .delete()
        .eq('party_id', party.id);

      if (partyProvincesError) {
        console.error('❌ Error eliminando provincias del partido:', partyProvincesError);
        throw new Error('Error eliminando disponibilidad por provincia');
      }
      console.log('✅ Disponibilidad por provincia eliminada');

      // Paso 3: Eliminar orden provincial
      console.log('📊 Eliminando orden provincial...');
      const { error: partyOrderError } = await supabase
        .from('political_party_provincial_order')
        .delete()
        .eq('party_id', party.id);

      if (partyOrderError) {
        console.error('❌ Error eliminando orden provincial:', partyOrderError);
        throw new Error('Error eliminando orden provincial');
      }
      console.log('✅ Orden provincial eliminado');

      // Paso 4: Eliminar relaciones con elecciones
      console.log('🗳️ Eliminando relaciones con elecciones...');
      const { error: electionPartiesError } = await supabase
        .from('election_parties')
        .delete()
        .eq('party_id', party.id);

      if (electionPartiesError) {
        console.error('❌ Error eliminando relaciones con elecciones:', electionPartiesError);
        throw new Error('Error eliminando relaciones con elecciones');
      }
      console.log('✅ Relaciones con elecciones eliminadas');

      // Paso 5: Eliminar el partido político
      console.log('🎭 Eliminando partido político...');
      const { error: partyError } = await supabase
        .from('political_parties')
        .delete()
        .eq('id', party.id);

      if (partyError) {
        console.error('❌ Error eliminando partido político:', partyError);
        throw new Error('Error eliminando el partido político');
      }
      console.log('✅ Partido político eliminado correctamente');

      // Éxito total
      toast({
        title: "Éxito",
        description: `El partido "${party.name}" (${party.siglas}) y toda su información asociada han sido eliminados correctamente.`,
      });

      setShowDeleteDialog(false);
      setIsOpen(false);
      onPartyUpdated?.();

    } catch (error) {
      console.error('💥 Error fatal eliminando partido:', error);
      toast({
        variant: "destructive",
        title: "Error al eliminar partido",
        description: error instanceof Error ? error.message : "No se pudo eliminar el partido político. Inténtalo de nuevo.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Edit className="h-3 w-3" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Partido Político
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar partido político?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el partido "{party.name}" ({party.siglas}).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
            <TabsTrigger value="provinces">Disponibilidad por Provincia</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <PoliticalPartyForm
              initialData={{
                name: party.name,
                siglas: party.siglas,
                color: party.color,
              }}
              onSubmit={handleSubmit}
              submitLabel="Actualizar Partido"
              isSubmitting={isUpdating}
            />
          </TabsContent>

          <TabsContent value="provinces" className="space-y-4">
            <ProvinceManagement partyId={party.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartyDialog;