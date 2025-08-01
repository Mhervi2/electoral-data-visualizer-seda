import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MultiImageUploadProps {
  onImagesChange: (images: File[]) => void;
  uploading?: boolean;
  maxImages?: number;
}

export const MultiImageUpload = ({ 
  onImagesChange, 
  uploading = false,
  maxImages = 5 
}: MultiImageUploadProps) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedImages.length + files.length > maxImages) {
      toast({
        variant: "destructive",
        title: "Demasiadas imágenes",
        description: `Solo se pueden subir máximo ${maxImages} imágenes.`,
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        toast({
          variant: "destructive",
          title: "Formato no válido",
          description: `${file.name} debe ser JPG, PNG o WebP.`,
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: `${file.name} debe ser menor a 5MB.`,
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      const newImages = [...selectedImages, ...validFiles];
      setSelectedImages(newImages);
      onImagesChange(newImages);

      // Create previews
      const newPreviews = [...previews];
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string);
          setPreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    e.target.value = '';
  }, [selectedImages, previews, maxImages, onImagesChange, toast]);

  const removeImage = useCallback((index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setPreviews(newPreviews);
    onImagesChange(newImages);
  }, [selectedImages, previews, onImagesChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Imágenes de Actas *</CardTitle>
        <CardDescription>
          Suba hasta {maxImages} imágenes de actas electorales (máximo 5MB cada una, formatos: JPG, PNG, WebP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => document.getElementById('multi-file-upload')?.click()}
            disabled={uploading || selectedImages.length >= maxImages}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Seleccionar Imágenes'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedImages.length} de {maxImages} imágenes seleccionadas
          </span>
          <input
            id="multi-file-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        
        {selectedImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Imágenes seleccionadas:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                    {previews[index] ? (
                      <img 
                        src={previews[index]} 
                        alt={`Vista previa ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedImages.length === 0 && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay imágenes seleccionadas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Haga clic en "Seleccionar Imágenes" para añadir hasta {maxImages} imágenes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};