
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Upload, Users, FileText, Settings, Eye, Calculator } from 'lucide-react';
import PartySuggestions from '@/components/admin/PartySuggestions';
import { ProvincialSeatsManager } from '@/components/admin/ProvincialSeatsManager';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos del sistema electoral.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Elecciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Crear y gestionar procesos electorales
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/elections">Gestionar Elecciones</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ficheros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Subir archivos de resultados oficiales
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/files">Gestionar Ficheros</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Resultados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Visualizar y verificar resultados electorales
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/results">Ver Resultados</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Partidos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Gestionar partidos políticos del sistema
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/political-parties">Ver Partidos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Escaños</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Configurar escaños por provincia
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="#seats">Gestionar Escaños</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Gestionar Actas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Editar y revisar actas enviadas por usuarios
            </CardDescription>
            <Button asChild className="w-full">
              <Link to="/admin/electoral-acts">Gestionar Actas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Provincial Seats Management */}
      <div id="seats">
        <ProvincialSeatsManager />
      </div>

      {/* Party Suggestions Section */}
      <PartySuggestions />

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Actas Recibidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Datos en tiempo real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Elecciones Activas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Procesos en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Total de usuarios</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
