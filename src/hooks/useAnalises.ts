
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface TipoAnalise {
  id: string;
  descricao: string;
  detalhamento: string | null;
  ativo: boolean;
  empresa_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoAnalise {
  id: string;
  dias_analise: number;
  empresa_id: number | null;
  created_at: string;
  updated_at: string;
}

// Hook otimizado para buscar tipos de análise
export const useTiposAnalise = () => {
  return useQuery({
    queryKey: ['tipos-analise'],
    queryFn: async () => {
      // Query otimizada usando RLS policy diretamente
      const { data, error } = await supabase
        .from('tipos_analise')
        .select('*')
        .order('descricao');
      
      if (error) throw error;
      return data as TipoAnalise[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook otimizado para buscar configuração de análise
export const useConfiguracaoAnalise = () => {
  return useQuery({
    queryKey: ['configuracao-analise'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_analise')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as ConfiguracaoAnalise | null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos
  });
};

// Hook para criar tipo de análise
export const useCreateTipoAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, refreshSession } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<TipoAnalise, 'id' | 'created_at' | 'updated_at'>) => {
      // Verificar autenticação básica
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }

      const { data: result, error } = await supabase
        .from('tipos_analise')
        .insert(data)
        .select()
        .single();
      
      if (error) {
        // Se for erro de RLS, tentar refresh uma vez
        if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
          console.log('RLS error detected, trying session refresh...');
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Tentar novamente após refresh
            const { data: retryResult, error: retryError } = await supabase
              .from('tipos_analise')
              .insert(data)
              .select()
              .single();
            
            if (retryError) throw retryError;
            return retryResult;
          } else {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-analise'] });
      toast({
        title: "Sucesso",
        description: "Tipo de análise criado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar tipo de análise:', error);
      
      if (error.message.includes('autenticação') || error.message.includes('Sessão expirada')) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar tipo de análise",
          variant: "destructive",
        });
      }
    }
  });
};

// Hook para atualizar tipo de análise
export const useUpdateTipoAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, refreshSession } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<TipoAnalise> & { id: string }) => {
      // Verificar autenticação básica
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }

      const { data: result, error } = await supabase
        .from('tipos_analise')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) {
        // Se for erro de RLS, tentar refresh uma vez
        if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
          console.log('RLS error detected, trying session refresh...');
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Tentar novamente após refresh
            const { data: retryResult, error: retryError } = await supabase
              .from('tipos_analise')
              .update(data)
              .eq('id', data.id)
              .select()
              .single();
            
            if (retryError) throw retryError;
            return retryResult;
          } else {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-analise'] });
      toast({
        title: "Sucesso",
        description: "Tipo de análise atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar tipo de análise:', error);
      
      if (error.message.includes('autenticação') || error.message.includes('Sessão expirada')) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar tipo de análise",
          variant: "destructive",
        });
      }
    }
  });
};

// Hook para salvar configuração de análise
export const useSaveConfiguracaoAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, refreshSession } = useAuth();

  return useMutation({
    mutationFn: async (diasAnalise: number) => {
      // Verificar autenticação básica
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }

      const { data: result, error } = await supabase
        .from('configuracoes_analise')
        .upsert({ 
          dias_analise: diasAnalise
        }, {
          onConflict: 'empresa_id'
        })
        .select()
        .single();
      
      if (error) {
        // Se for erro de RLS, tentar refresh uma vez
        if (error.message.includes('row-level security') || error.message.includes('violates row-level security')) {
          console.log('RLS error detected, trying session refresh...');
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Tentar novamente após refresh
            const { data: retryResult, error: retryError } = await supabase
              .from('configuracoes_analise')
              .upsert({ 
                dias_analise: diasAnalise
              }, {
                onConflict: 'empresa_id'
              })
              .select()
              .single();
            
            if (retryError) throw retryError;
            return retryResult;
          } else {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-analise'] });
      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao salvar configuração:', error);
      
      if (error.message.includes('autenticação') || error.message.includes('Sessão expirada')) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar configuração",
          variant: "destructive",
        });
      }
    }
  });
};
