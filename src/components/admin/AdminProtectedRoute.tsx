
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(credentials.email, credentials.password);
      if (success) {
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel de administración.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Las credenciales no corresponden a un administrador o son incorrectas.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al intentar iniciar sesión.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <img 
              src="https://placehold.co/80x80/A80000/FFFFFF.png?text=SEDA" 
              alt="SEDA Electoral Logo" 
              className="h-20 w-20 mx-auto"
              data-ai-hint="SEDA Electoral logo"
            />
            <div>
              <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle>Panel exclusivo para administradores</CardTitle>
              <CardDescription>
                Este acceso está restringido.<br/>
                Introduce el <b>usuario y contraseña de administrador</b> para poder acceder al panel.
                <br/>
                <span className="block mt-2 text-yellow-700 font-semibold">
                  Si NO eres administrador, deja esta página.
                </span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo de administrador</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="superadmin@seda.es"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="tu_contraseña"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Verificando...' : 'Entrar como Administrador'}
              </Button>
              <div className="mt-4 p-4 bg-accent/20 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Para acceder como administrador:</strong><br />
                  Usuario: <strong>superadmin@seda.es</strong><br />
                  Contraseña: <strong>AdminFuerte#2024</strong><br />
                  Este login es exclusivo para administradores.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              Tu usuario no tiene permisos de administrador.<br/>
              El panel de administración es exclusivo para administradores autorizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Volver a la página principal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
