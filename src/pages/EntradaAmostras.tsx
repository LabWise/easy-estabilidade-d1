import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { FormularioAmostra } from '../components/FormularioAmostra';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
const EntradaAmostras = () => {
  return <ResponsiveLayout title="Entrada de Amostras">
      <div className="max-w-4xl mx-auto space-y-6">
        
        
        <FormularioAmostra />
      </div>
    </ResponsiveLayout>;
};
export default EntradaAmostras;