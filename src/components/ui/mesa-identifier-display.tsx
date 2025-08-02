import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseFullMesaIdentifier, fullToShortMesaIdentifier } from '@/utils/mesaIdentifierUtils';
import { Info } from 'lucide-react';

interface MesaIdentifierDisplayProps {
  mesaIdentifier?: string;
  mesaIdentifierFull?: string;
  showTooltip?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default';
}

export const MesaIdentifierDisplay: React.FC<MesaIdentifierDisplayProps> = ({
  mesaIdentifier,
  mesaIdentifierFull,
  showTooltip = true,
  variant = 'outline',
  size = 'default'
}) => {
  const shortIdentifier = mesaIdentifierFull 
    ? fullToShortMesaIdentifier(mesaIdentifierFull)
    : mesaIdentifier;

  const parsed = parseFullMesaIdentifier(mesaIdentifierFull);
  
  const tooltipContent = parsed.isValid ? (
    <div className="space-y-2">
      <div className="font-semibold">Identificador Completo de Mesa</div>
      <div className="space-y-1 text-sm">
        <div><strong>IDCA:</strong> {parsed.idca} (Comunidad Autónoma)</div>
        <div><strong>IDP:</strong> {parsed.idp} (Provincia)</div>
        <div><strong>IDM:</strong> {parsed.idm} (Municipio)</div>
        <div><strong>DD:</strong> {parsed.district} (Distrito)</div>
        <div><strong>SSS:</strong> {parsed.section} (Sección)</div>
        <div><strong>M:</strong> {parsed.table} (Mesa)</div>
      </div>
      <div className="pt-2 border-t text-xs text-muted-foreground">
        Formato: XX-YY-ZZZ-DD-SSS-M
      </div>
    </div>
  ) : null;

  const displayElement = (
    <div className="flex items-center space-x-1">
      <Badge variant={variant} className={size === 'sm' ? 'text-xs' : ''}>
        {shortIdentifier || 'N/A'}
      </Badge>
      {mesaIdentifierFull && showTooltip && (
        <Info className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  );

  if (mesaIdentifierFull && showTooltip && parsed.isValid) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {displayElement}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return displayElement;
};

interface FullMesaIdentifierProps {
  mesaIdentifierFull?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default';
}

export const FullMesaIdentifier: React.FC<FullMesaIdentifierProps> = ({
  mesaIdentifierFull,
  variant = 'secondary',
  size = 'sm'
}) => {
  if (!mesaIdentifierFull) {
    return null;
  }

  return (
    <Badge variant={variant} className={size === 'sm' ? 'text-xs font-mono' : 'font-mono'}>
      {mesaIdentifierFull}
    </Badge>
  );
};