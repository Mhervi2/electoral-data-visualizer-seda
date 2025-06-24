
import React from 'react';
import { BiometricSetup } from '@/components/auth/BiometricSetup';

const BiometricSettings = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración Biométrica</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus dispositivos biométricos para acceso seguro y rápido al panel de administración.
          </p>
        </div>
        
        <BiometricSetup />
      </div>
    </div>
  );
};

export default BiometricSettings;
