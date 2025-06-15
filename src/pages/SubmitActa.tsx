
import React from 'react';
import { SubmitActaForm } from '@/components/acta/SubmitActaForm';

const SubmitActa = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
        Enviar Acta Electoral
      </h1>

      <SubmitActaForm />
    </div>
  );
};

export default SubmitActa;
