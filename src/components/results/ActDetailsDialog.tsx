
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

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

interface ActDetailsDialogProps {
  act: ElectoralAct;
}

export const ActDetailsDialog = ({ act }: ActDetailsDialogProps) => {
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
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Image className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Imagen del Acta</DialogTitle>
          <DialogDescription>
            Mesa {act.table_letter} - {getLocationDisplay(act)} D:{act.district} S:{act.section}
          </DialogDescription>
        </DialogHeader>
        {act.image_url && (
          <img 
            src={act.image_url} 
            alt="Acta electoral" 
            className="w-full h-auto rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
