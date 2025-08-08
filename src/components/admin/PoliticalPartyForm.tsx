import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const partySchema = z.object({
  name: z.string().min(1, 'El nombre del partido es obligatorio'),
  siglas: z.string().min(1, 'Las siglas son obligatorias').max(10, 'Las siglas no pueden exceder 10 caracteres'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hex válido (#RRGGBB)'),
});

export type PoliticalPartyFormData = z.infer<typeof partySchema>;

export { type PoliticalPartyFormData as PoliticalPartyData };

interface PoliticalPartyFormProps {
  initialData?: PoliticalPartyFormData;
  onSubmit: (data: PoliticalPartyFormData) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
}

const PoliticalPartyForm: React.FC<PoliticalPartyFormProps> = ({
  initialData,
  onSubmit,
  submitLabel,
  isSubmitting,
}) => {
  const form = useForm<PoliticalPartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: initialData || {
      name: '',
      siglas: '',
      color: '#6B7280',
    },
  });

  const watchedColor = form.watch('color');
  const watchedSiglas = form.watch('siglas');
  const watchedName = form.watch('name');

  const handleSubmit = async (data: PoliticalPartyFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Partido</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Partido Popular"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="siglas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Siglas</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: PP"
                  maxLength={10}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color del Partido</FormLabel>
              <div className="flex gap-3 items-center">
                <FormControl>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      {...field}
                      className="w-12 h-10 rounded border border-input cursor-pointer"
                    />
                    <Input 
                      placeholder="#6B7280"
                      {...field}
                      className="font-mono"
                      onChange={(e) => {
                        const value = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                        field.onChange(value);
                      }}
                    />
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="space-y-2">
          <Label>Vista Previa</Label>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: watchedColor }}
                >
                  {watchedSiglas || 'XX'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold leading-tight">
                    {watchedSiglas || 'Siglas'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {watchedName || 'Nombre del partido'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default PoliticalPartyForm;