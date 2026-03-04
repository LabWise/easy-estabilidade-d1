import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedPageRouteProps {
  children: React.ReactNode;
  page: string;
  requireAuditTrail?: boolean;
}

export const ProtectedPageRoute: React.FC<ProtectedPageRouteProps> = ({ 
  children, 
  page, 
  requireAuditTrail = false 
}) => {
  // Verificar se o contexto de auth está carregado
  const { loading, user } = useAuth();
  
  // Se ainda está carregando ou usuário não está autenticado, retornar loading
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Agora é seguro usar useUserProfile
  const { canAccessPage, canAccessAuditTrail } = useUserProfile();
  
  // Verificar acesso específico para Audit Trail
  if (requireAuditTrail && !canAccessAuditTrail()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página está disponível apenas para administradores e gestores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Verificar acesso geral à página
  if (!canAccessPage(page)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
};