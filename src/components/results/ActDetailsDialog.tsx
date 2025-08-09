
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, ExternalLink } from 'lucide-react';
import { ZoomableImage } from '@/components/ui/zoomable-image';


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
  const isGoogleDriveUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com');
  };

  const convertToUserContentUrl = (driveUrl: string): string => {
    try {
      // Extract file ID from different Google Drive URL formats
      let fileId = '';
      
      if (driveUrl.includes('drive.google.com/file/d/')) {
        const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (match) fileId = match[1];
      } else if (driveUrl.includes('drive.google.com/open?id=')) {
        const match = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (match) fileId = match[1];
      } else if (driveUrl.includes('drive.google.com/uc?export=view&id=')) {
        const match = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (match) fileId = match[1];
      }
      
      if (fileId) {
        return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
      }
      
      return driveUrl;
    } catch (error) {
      console.error('Error converting Drive URL:', error);
      return driveUrl;
    }
  };

  const handleImageClick = () => {
    if (isGoogleDriveUrl(act.image_url!) && act.image_url) {
      const userContentUrl = convertToUserContentUrl(act.image_url);
      window.open(userContentUrl, '_blank', 'noopener,noreferrer');
    }
  };

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

  // For Google Drive images, open in new window instead of modal
  if (isGoogleDriveUrl(act.image_url!) && act.image_url) {
    return (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleImageClick}
        title="Abrir imagen en nueva ventana"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Image className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Imagen del Acta</DialogTitle>
          <DialogDescription>
            Mesa {act.mesa_identifier} ({table}) - {getLocationDisplay(act)} D:{district} S:{section}
          </DialogDescription>
        </DialogHeader>
        {act.image_url && (
          <div className="px-6 pb-6 flex-1 min-h-0">
            <ZoomableImage 
              src={act.image_url} 
              alt="Acta electoral"
              className="w-full h-full"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
