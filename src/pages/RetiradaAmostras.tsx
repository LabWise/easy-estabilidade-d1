import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { FormularioRetiradaAmostra } from '../components/RetiradaAmostras/FormularioRetiradaAmostra';

const RetiradaAmostras = () => {
  return (
    <ResponsiveLayout title="Retirada de Amostras">
      <div className="max-w-4xl mx-auto">
        <FormularioRetiradaAmostra />
      </div>
    </ResponsiveLayout>
  );
};

export default RetiradaAmostras;