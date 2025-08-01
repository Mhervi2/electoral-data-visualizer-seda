
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

interface ElectoralAct {
  id: string;
  municipality_idm: number;
  mesa_identifier: string;
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

  const parseMesaIdentifier = (mesaIdentifier: string | null | undefined) => {
    if (!mesaIdentifier) {
      return {
        district: '',
        section: '',
        table: ''
      };
    }
    const parts = mesaIdentifier.split('-');
    return {
      district: parts[0] || '',
      section: parts[1] || '',
      table: parts[2] || ''
    };
  };

  const { district, section, table } = parseMesaIdentifier(act.mesa_identifier);

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
            Mesa {act.mesa_identifier} ({table}) - {getLocationDisplay(act)} D:{district} S:{section}
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
