import React from 'react';
import { ProvincialSeatsManager } from '@/components/admin/ProvincialSeatsManager';

const ProvincialSeats = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk">Gestión de Escaños Provinciales</h1>
        <p className="text-muted-foreground">
          Configura la distribución de escaños por provincia para cada elección.
        </p>
      </div>
      
      <ProvincialSeatsManager />
    </div>
  );
};

export default ProvincialSeats;