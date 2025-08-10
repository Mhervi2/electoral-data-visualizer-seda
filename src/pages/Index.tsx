
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, UploadCloud, Users, Calculator, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user } = useAuth();

  const quickAccessCards = [
    {
      title: 'Ver Resultados',
      description: 'Analiza y compara los últimos resultados electorales.',
      icon: BarChart3,
      href: '/results',
      variant: 'default' as const,
    },
    {
      title: 'Enviar Acta',
      description: 'Sube y procesa una nueva acta electoral.',
      icon: UploadCloud,
      href: '/submit-acta',
      variant: 'default' as const,
    },
    {
      title: 'Partidos Políticos',
      description: 'Consulta la lista de partidos.',
      icon: Users,
      href: '/political-parties',
      variant: 'default' as const,
    },
    {
      title: 'Calculadora D\'Hondt',
      description: 'Calcula la distribución de escaños.',
      icon: Calculator,
      href: '/dhondt-calculator',
      variant: 'default' as const,
    },
  ];

  if (user?.isAdmin) {
    quickAccessCards.push({
      title: 'Panel Admin',
      description: 'Accede a las herramientas de administración.',
      icon: Shield,
      href: '/admin',
      variant: 'default' as const,
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground font-space-grotesk">
          Bienvenido a SEDA Electoral
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tu plataforma centralizada para la gestión y análisis de datos electorales.
        </p>
        <p className="text-muted-foreground">
          Desde aquí puedes acceder a todas las funcionalidades clave de la aplicación. 
          Utiliza los enlaces rápidos a continuación o el menú lateral para navegar.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAccessCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${card.icon === Shield ? 'bg-primary' : 'bg-accent'}`}>
                  <card.icon className={`h-6 w-6 ${card.icon === Shield ? 'text-primary-foreground' : 'text-accent-foreground'}`} />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{card.description}</CardDescription>
              <Button 
                asChild 
                className="w-full" 
                variant={card.icon === Shield ? 'default' : 'outline'}
              >
                <Link to={card.href}>
                  Acceder
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default Index;
