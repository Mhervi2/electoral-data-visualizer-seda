
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <img 
              src="https://placehold.co/30x30/A80000/FFFFFF.png?text=C" 
              alt="Constituyentes Logo" 
              className="h-6 w-6"
              data-ai-hint="logo simple constituyentes"
            />
            <p className="text-sm text-muted-foreground">
              © {currentYear} SEDA Electoral. Todos los derechos reservados.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <Link 
              to="/terminos" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos de Servicio
            </Link>
            <Link 
              to="/privacidad" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidad
            </Link>
            <a 
              href="https://www.constituyentes.es" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Desarrollado por Constituyentes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
