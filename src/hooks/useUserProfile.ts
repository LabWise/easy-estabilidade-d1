import { useAuth } from '@/hooks/useAuth';

export type ProfileType = 'administrador' | 'gestor' | 'analista_de_estabilidade' | 'analista_de_laboratorio';

export const useUserProfile = () => {
  const { user } = useAuth();
  
  const profileType = user?.profile_type as ProfileType || 'analista_de_laboratorio';
  
  const canAccessPage = (page: string): boolean => {
    switch (profileType) {
      case 'administrador':
      case 'gestor':
        return true; // Acesso total
      
      case 'analista_de_estabilidade':
        // Pode acessar todas exceto análises e configurações
        return !['analises', 'gestao', 'configuracoes'].includes(page);
      
      case 'analista_de_laboratorio':
        // Pode acessar todas exceto entrada, gestão, retirada e configurações
        return !['entrada', 'gestao', 'retirada', 'configuracoes'].includes(page);
      
      default:
        return false;
    }
  };
  
  const canAccessAuditTrail = (): boolean => {
    return ['administrador', 'gestor'].includes(profileType);
  };
  
  return {
    profileType,
    canAccessPage,
    canAccessAuditTrail,
    isAdmin: profileType === 'administrador',
    isManager: profileType === 'gestor',
    isStabilityAnalyst: profileType === 'analista_de_estabilidade',
    isLabAnalyst: profileType === 'analista_de_laboratorio'
  };
};