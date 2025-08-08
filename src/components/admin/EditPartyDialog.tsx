import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PoliticalPartyForm, { PoliticalPartyFormData } from './PoliticalPartyForm';
import { usePoliticalPartiesManagement, type PoliticalPartyData } from '@/hooks/usePoliticalPartiesManagement';

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
  const { updateParty, deleteParty, isUpdating, isDeleting } = usePoliticalPartiesManagement();

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
    const success = await deleteParty(party.id);
    if (success) {
      setShowDeleteDialog(false);
      setIsOpen(false);
      onPartyUpdated?.();
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
      <DialogContent className="sm:max-w-[500px]">
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
      </DialogContent>
    </Dialog>
  );
};

export default EditPartyDialog;