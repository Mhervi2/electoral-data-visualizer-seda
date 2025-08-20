
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ResultsDataProps {
  censo: string;
  votantes: string;
  blancos: string;
  nulos: string;
  observations?: string;
  onInputChange: (field: string, value: string) => void;
}

export const ResultsData = ({ censo, votantes, blancos, nulos, observations, onInputChange }: ResultsDataProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados del Acta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="censo">Total Censo *</Label>
            <Input
              id="censo"
              type="number"
              value={censo}
              onChange={(e) => onInputChange('censo', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="votantes">Total Votantes *</Label>
            <Input
              id="votantes"
              type="number"
              value={votantes}
              onChange={(e) => onInputChange('votantes', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="nulos">Votos Nulos *</Label>
            <Input
              id="nulos"
              type="number"
              value={nulos}
              onChange={(e) => onInputChange('nulos', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="blancos">Votos en Blanco *</Label>
            <Input
              id="blancos"
              type="number"
              value={blancos}
              onChange={(e) => onInputChange('blancos', e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Observations field */}
        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones</Label>
          <Textarea
            id="observations"
            value={observations || ''}
            onChange={(e) => onInputChange('observations', e.target.value)}
            placeholder="Observaciones opcionales sobre el acta electoral..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
