
import React from 'react';
import { ResponsiveLayout } from '@/components/Layout/ResponsiveLayout';

interface LoadingStateProps {
  title: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ title }) => {
  return (
    <ResponsiveLayout title={title}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando amostras...</p>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

interface ErrorStateProps {
  title: string;
  error: { message: string };
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title, error }) => {
  return (
    <ResponsiveLayout title={title}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar amostras</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>  
    </ResponsiveLayout>
  );
};

interface EstadosCarregamentoProps {
  isLoading: boolean;
  error: any;
}

export const EstadosCarregamento: React.FC<EstadosCarregamentoProps> = ({ isLoading, error }) => {
  if (isLoading) {
    return <LoadingState title="Gestão de Amostras" />;
  }

  if (error) {
    return <ErrorState title="Gestão de Amostras" error={error} />;
  }

  return null;
};
