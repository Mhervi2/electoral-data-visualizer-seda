import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

const getProxiedImageUrl = (originalUrl: string) => {
  if (originalUrl.includes('drive.google.com')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/proxy-drive-image?url=${encodeURIComponent(originalUrl)}`;
  }
  return originalUrl;
};

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  trigger?: React.ReactNode;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  trigger 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
  }, []);

  const proxiedSrc = getProxiedImageUrl(src);

  const defaultTrigger = (
    <div className={`relative group cursor-pointer ${className}`}>
      <img 
        src={proxiedSrc} 
        alt={alt} 
        className="w-full h-auto rounded-lg border shadow-sm transition-all group-hover:shadow-md" 
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-all bg-white bg-opacity-90 rounded-full p-2">
          <Maximize2 className="h-6 w-6 text-gray-700" />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Vista de la imagen del acta</DialogTitle>
        </DialogHeader>
        
        {/* Controles de zoom */}
        <div className="flex justify-center gap-2 px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Contenedor de la imagen */}
        <div 
          className="relative overflow-hidden bg-gray-50 mx-6 mb-6 rounded-lg border"
          style={{ height: '60vh' }}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={proxiedSrc}
            alt={alt}
            className={`max-w-none transition-transform duration-200 ${
              scale > 1 ? 'cursor-grab' : 'cursor-default'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
          />
        </div>

        <div className="px-6 pb-4">
          <p className="text-sm text-muted-foreground text-center">
            Usa la rueda del ratón para hacer zoom, o arrastra para mover la imagen cuando esté ampliada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};