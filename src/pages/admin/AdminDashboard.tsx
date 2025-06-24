import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vote, FileText, BarChart3, Users, Upload, Activity, Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminDashboard = () => {
  const { user, biometric } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido, {user?.email}. Gestiona las elecciones y archivos del sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Elecciones */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Gestión de Elecciones
              </CardTitle>
              <CardDescription>
                Crear y gestionar procesos electorales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Administra elecciones activas, crea nuevas y revisa resultados.
                </p>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link to="/admin/elections">
                  <Vote className="h-4 w-4 mr-2" />
                  Gestionar Elecciones
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card de Archivos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestión de Archivos
              </CardTitle>
              <CardDescription>
                Cargar y procesar archivos electorales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sube archivos Excel con datos electorales y gestiona el contenido.
                </p>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link to="/admin/files">
                  <FileText className="h-4 w-4 mr-2" />
                  Gestionar Archivos
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card de Configuración Biométrica */}
          {biometric.isSupported && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Configuración Biométrica
                </CardTitle>
                <CardDescription>
                  Gestiona tus dispositivos biométricos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Configura acceso rápido y seguro con huella dactilar o reconocimiento facial.
                  </p>
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button asChild className="w-full" variant="outline">
                  <Link to="/admin/biometric">
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Configurar Biometría
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Actas Procesadas</span>
              </div>
              <p className="text-2xl font-bold">-</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Usuarios Activos</span>
              </div>
              <p className="text-2xl font-bold">-</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Archivos Subidos</span>
              </div>
              <p className="text-2xl font-bold">-</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Sistema</span>
              </div>
              <p className="text-2xl font-bold text-green-600">Activo</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
