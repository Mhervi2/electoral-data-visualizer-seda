
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, BarChart3, Upload, Users, Settings, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const summaryCards = [
    {
      title: 'Elecciones Activas',
      value: '1',
      description: '+ 1 elecciones cerradas',
      href: '/admin/elections',
      icon: BarChart3,
    },
    {
      title: 'Ficheros de Resultados',
      value: '2',
      description: 'Ficheros de Indra, Escrutinio y Oficiales',
      href: '/admin/files',
      icon: Upload,
    },
    {
      title: 'Usuarios Registrados',
      value: '152',
      description: '+ 5 nuevos esta semana',
      href: '/admin/users',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona las preferencias generales de la aplicación.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={card.href}>Gestionar {card.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Elections Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Gestión de Elecciones</span>
            </CardTitle>
            <CardDescription>
              Crea y administra procesos electorales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <Link to="/admin/elections/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Elección
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/admin/elections">Ver Todas las Elecciones</Link>
              </Button>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg">
              <h4 className="font-medium text-sm">Elecciones Municipales 2023</h4>
              <p className="text-xs text-muted-foreground">Fecha: 2023-05-28 - Estado: Cerrada</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-sm">Elecciones Generales 2023</h4>
              <p className="text-xs text-muted-foreground">Fecha: 2023-07-23 - Estado: Activa</p>
            </div>
          </CardContent>
        </Card>

        {/* Files Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Gestión de Ficheros de Resultados</span>
            </CardTitle>
            <CardDescription>
              Sube y gestiona archivos Excel con resultados oficiales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <Link to="/admin/files/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Fichero
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/admin/files">Ver Todos los Ficheros</Link>
              </Button>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-accent/20 rounded-lg">
                <h4 className="font-medium text-sm">Resultados Indra - Municipales 2023</h4>
                <p className="text-xs text-muted-foreground">Subido: 2023-05-29</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-sm">Escrutinio Oficial - Generales 2023</h4>
                <p className="text-xs text-muted-foreground">Subido: 2023-07-24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración del Sistema</span>
          </CardTitle>
          <CardDescription>
            Accede a las configuraciones avanzadas de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Configuración General</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Parámetros D'Hondt por Defecto</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
              <Shield className="h-6 w-6" />
              <span className="text-sm">Roles y Permisos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
