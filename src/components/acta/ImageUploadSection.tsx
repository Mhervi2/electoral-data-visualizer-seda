
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';

interface ImageUploadSectionProps {
  imagen?: File;
  imageUrl?: string;
  uploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploadSection = ({ imagen, imageUrl, uploading, onImageUpload }: ImageUploadSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagen del Acta *</CardTitle>
        <CardDescription>
          Suba una imagen clara del acta electoral (máximo 5MB, formatos: JPG, PNG, WebP)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </Button>
          <Button type="button" variant="outline" disabled>
            <Camera className="h-4 w-4 mr-2" />
            Tomar Foto (Próximamente)
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onImageUpload}
            className="hidden"
          />
        </div>
        
        {imagen && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ✓ Archivo seleccionado: {imagen.name}
            </p>
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="Vista previa del acta" 
                  className="max-w-xs rounded-lg border"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
