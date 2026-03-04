import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Usuario {
  id: string;
  auth_id?: string;
  nome: string;
  email?: string; // Opcional para usuários comuns
  profile_type: 'administrador' | 'gestor' | 'analista_de_estabilidade' | 'analista_de_laboratorio';
  empresa_id: number;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  profile_type: 'administrador' | 'gestor' | 'analista_de_estabilidade' | 'analista_de_laboratorio';
  empresa_id: number;
  ativo: boolean;
  created_at: string;
}

export interface ConviteUsuario {
  nome: string;
  email: string;
  profile_type: 'administrador' | 'gestor' | 'analista_de_estabilidade' | 'analista_de_laboratorio';
}

// Hook para listar usuários com controle de acesso granular
export const useUsuarios = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['usuarios', user?.profile_type],
    queryFn: async () => {
      console.log('Buscando usuários...');
      
      // Determinar quais campos selecionar baseado no perfil do usuário
      const isAdminOrManager = user?.profile_type === 'administrador' || user?.profile_type === 'gestor';
      
      let selectFields = 'id, nome, profile_type, empresa_id, ativo, created_at';
      
      // Administradores e gestores veem todos os campos, incluindo email
      if (isAdminOrManager) {
        selectFields = '*';
      }
      
      const { data, error } = await supabase
        .from('usuarios')
        .select(selectFields)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      console.log('Usuários encontrados:', data?.length);
      console.log('Perfil do usuário atual:', user?.profile_type);
      console.log('Campos retornados:', isAdminOrManager ? 'completos' : 'públicos');
      
      // Mapear os dados para garantir compatibilidade de tipos
      const usuarios = (data || []).map((item: any) => {
        if (isAdminOrManager) {
          // Admin/gestor vê todos os campos
          return item as Usuario;
        } else {
          // Usuário comum vê apenas campos públicos - remover propriedades sensíveis
          const { email, updated_at, auth_id, ...publicData } = item;
          return publicData as Usuario;
        }
      });
      
      return usuarios;
    },
    enabled: !!user, // Só executar quando tiver usuário logado
  });
};

// Hook para convidar usuário
export const useConvidarUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: ConviteUsuario) => {
      console.log('Enviando convite para:', dados);
      
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: dados
      });

      if (error) {
        console.error('Erro ao enviar convite:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    },
  });
};

// Hook para atualizar usuário
export const useAtualizarUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    },
  });
};

// Hook para desativar usuário
export const useDesativarUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário desativado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao desativar usuário:', error);
      toast.error('Erro ao desativar usuário');
    },
  });
};