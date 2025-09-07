
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user?.isAdmin) {
      const redirect = searchParams.get('redirect') || '/admin';
      navigate(redirect);
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al panel de administración.",
        });
        const redirect = searchParams.get('redirect') || '/admin';
        navigate(redirect);
      } else {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "Credenciales inválidas. Verifica tu email y contraseña.",
        });
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

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-space-grotesk text-primary">
              Acceso Administrador
            </CardTitle>
            <CardDescription>
              Inicia sesión para gestionar el panel de administración.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="superadmin@seda.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="tu_contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Volver a la página principal
              </Link>
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
