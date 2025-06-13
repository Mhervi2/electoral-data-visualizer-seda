
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Bell, Moon, Shield } from 'lucide-react';

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setDarkMode(isDarkMode);
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferencias guardadas",
      description: "Tus configuraciones han sido actualizadas correctamente.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
            Configuración de la Aplicación
          </h1>
          <p className="text-muted-foreground">
            Personaliza tu experiencia en SEDA Electoral
          </p>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información General
          </CardTitle>
          <CardDescription>
            Información básica de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://placehold.co/64x64/A80000/FFFFFF.png?text=SEDA" />
              <AvatarFallback>SEDA</AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <div>
                <Label htmlFor="app-name">Nombre de la Aplicación</Label>
                <Input
                  id="app-name"
                  value="SEDA Electoral"
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Correo de Contacto</Label>
                <Input
                  id="contact-email"
                  value="info@seda.es"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias Visuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Moon className="h-5 w-5 mr-2" />
            Preferencias Visuales
          </CardTitle>
          <CardDescription>
            Personaliza la apariencia de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications">Habilitar Notificaciones</Label>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones sobre actualizaciones y eventos importantes
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dark-mode">Modo Oscuro</Label>
              <p className="text-sm text-muted-foreground">
                Cambia a un tema oscuro para reducir la fatiga visual
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Seguridad
          </CardTitle>
          <CardDescription>
            Configuración de seguridad de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-accent/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Modo Público Activado:</strong> Esta aplicación está configurada en modo público.
              La configuración de contraseñas y autenticación avanzada está disponible
              únicamente para administradores a través del panel de administración.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Versión</Label>
              <p className="text-sm text-muted-foreground">SEDA Electoral v1.0.0</p>
            </div>
            <div>
              <Label>Desarrollado por</Label>
              <p className="text-sm text-muted-foreground">
                <a 
                  href="https://www.constituyentes.es" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Constituyentes
                </a>
              </p>
            </div>
            <div>
              <Label>Última actualización</Label>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <Label>Estado del servicio</Label>
              <p className="text-sm text-green-600 dark:text-green-400">
                ● Operativo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSavePreferences}>
          Guardar Preferencias (Simulado)
        </Button>
      </div>
    </div>
  );
};

export default Settings;
