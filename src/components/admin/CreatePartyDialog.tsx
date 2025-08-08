import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PoliticalPartyForm, { PoliticalPartyFormData } from './PoliticalPartyForm';
import { usePoliticalPartiesManagement, type PoliticalPartyData } from '@/hooks/usePoliticalPartiesManagement';

interface CreatePartyDialogProps {
  onPartyCreated?: () => void;
}

const CreatePartyDialog: React.FC<CreatePartyDialogProps> = ({ onPartyCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createParty, isCreating } = usePoliticalPartiesManagement();

  const handleSubmit = async (data: PoliticalPartyFormData) => {
    const partyData: PoliticalPartyData = {
      name: data.name,
      siglas: data.siglas,
      color: data.color,
    };
    const success = await createParty(partyData);
    if (success) {
      setIsOpen(false);
      onPartyCreated?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Nuevo Partido
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Partido Político</DialogTitle>
        </DialogHeader>
        <PoliticalPartyForm
          onSubmit={handleSubmit}
          submitLabel="Crear Partido"
          isSubmitting={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePartyDialog;