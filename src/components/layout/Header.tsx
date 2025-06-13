
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, BarChart3, UploadCloud, Calculator, Users, Shield, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Inicio', path: '/', icon: Home },
    { id: 'results', label: 'Resultados Electorales', path: '/results', icon: BarChart3 },
    { id: 'submit-acta', label: 'Enviar Acta', path: '/submit-acta', icon: UploadCloud },
    { id: 'dhondt-calculator', label: 'Calculadora D\'Hondt', path: '/dhondt-calculator', icon: Calculator },
    { id: 'political-parties', label: 'Partidos Políticos', path: '/political-parties', icon: Users },
  ];

  if (user?.isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', path: '/admin', icon: Shield });
  }

  const getCurrentTab = () => {
    const currentPath = location.pathname;
    if (currentPath === '/') return 'home';
    if (currentPath.startsWith('/results')) return 'results';
    if (currentPath.startsWith('/submit-acta')) return 'submit-acta';
    if (currentPath.startsWith('/dhondt-calculator')) return 'dhondt-calculator';
    if (currentPath.startsWith('/political-parties')) return 'political-parties';
    if (currentPath.startsWith('/admin')) return 'admin';
    return 'home';
  };

  return (
    <header className="border-b bg-card">
      {/* Top section with logo and actions */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://placehold.co/40x40/A80000/FFFFFF.png?text=SEDA" 
                alt="SEDA Electoral Logo" 
                className="h-10 w-10"
                data-ai-hint="SEDA Electoral logo"
              />
              <div>
                <h1 className="text-xl font-bold text-primary font-space-grotesk">SEDA Electoral</h1>
                <p className="text-xs text-muted-foreground">Constituyentes</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            
            {user?.isAdmin ? (
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login?redirect=/admin">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="container mx-auto px-4">
        <Tabs value={getCurrentTab()} className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 bg-secondary/50">
            {navItems.map((item) => (
              item.id === 'admin' ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value={item.id} 
                      className="flex items-center space-x-2 px-3 py-2"
                      asChild
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                      </Link>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Panel de Administración</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <TabsTrigger 
                  key={item.id}
                  value={item.id} 
                  className="flex items-center space-x-2 px-3 py-2"
                  asChild
                >
                  <Link to={item.path}>
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </TabsTrigger>
              )
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
};

export default Header;
