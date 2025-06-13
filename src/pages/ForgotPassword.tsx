
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Instrucciones enviadas",
          description: "Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.",
        });
        setIsSubmitted(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ha ocurrido un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img 
            src="https://placehold.co/80x80/A80000/FFFFFF.png?text=SEDA" 
            alt="SEDA Electoral Logo" 
            className="h-20 w-20 mx-auto"
            data-ai-hint="SEDA Electoral logo"
          />
          <div>
            <CardTitle className="text-2xl font-space-grotesk text-primary">
              Restablecer Contraseña
            </CardTitle>
            <CardDescription>
              {isSubmitted 
                ? "Revisa tu email para continuar"
                : "Introduce tu email para recibir instrucciones"
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Si el email proporcionado está registrado en nuestro sistema, 
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@seda.es"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Instrucciones'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
