
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, error, login, logout, clearAuthCache } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Timeout reduzido para 3 segundos para melhor performance
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute timeout triggered after 3s - showing manual options');
        setShowTimeout(true);
      }
    }, 3000); // 3 segundos

    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleReset = async () => {
    console.log('Manual auth reset triggered - limpando cache e fazendo logout completo...');
    try {
      // Primeiro limpar cache
      clearAuthCache();
      
      // Logout forçado tanto no Supabase quanto no contexto
      await supabase.auth.signOut();
      await logout();
      
      // Forçar reload da página para garantir estado limpo
      console.log('Reset completo executado com sucesso');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Erro durante reset:', error);
      // Mesmo com erro, tentar reload
      window.location.reload();
    }
    setShowTimeout(false);
  };

  const handleRetry = () => {
    console.log('Manual retry triggered');
    setShowTimeout(false);
    window.location.reload();
  };

  if (loading && !showTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Problemas de conectividade detectados</p>
          <p className="text-sm text-muted-foreground">
            Possível problema de cache. Clique em "Limpar Cache" e depois em "Tentar Novamente" para resolver:
          </p>
          <div className="space-x-4">
            <button 
              onClick={handleReset} 
              className="px-6 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 font-medium"
            >
              Limpar Cache
            </button>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} loading={loading} error={error} />;
  }

  return <>{children}</>;
};
