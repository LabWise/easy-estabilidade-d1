import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { BuscaAmostraAnalise } from '../components/AnalisesLaboratoriais/BuscaAmostraAnalise';

const AnalisesLaboratoriais = () => {
  return (
    <ResponsiveLayout title="Análises Laboratoriais">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-card rounded-lg border p-6">
          <BuscaAmostraAnalise />
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default AnalisesLaboratoriais;