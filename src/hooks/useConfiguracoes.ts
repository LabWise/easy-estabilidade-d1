import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos para Produtos
export interface Produto {
  id: string;
  nome: string;
  codigo: string;
  principio_ativo?: string;
  concentracao?: string;
  forma_farmaceutica?: string;
  fabricante?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para Equipamentos
export interface Equipamento {
  id: string;
  nome: string;
  codigo: string;
  tipo: string;
  localizacao?: string;
  temperatura_min?: number;
  temperatura_max?: number;
  umidade_min?: number;
  umidade_max?: number;
  capacidade?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para períodos de retirada
export interface PeriodoRetirada {
  periodo: string;
  dias: number;
}

// Tipos para Tipos de Estabilidade
export interface TipoEstabilidade {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string;
  periodos_retirada?: PeriodoRetirada[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function para converter Json para PeriodoRetirada[]
const convertJsonToPeriodos = (json: any): PeriodoRetirada[] => {
  if (!json || !Array.isArray(json)) return [];
  return json.map((item: any) => ({
    periodo: item.periodo || '',
    dias: item.dias || 0
  }));
};

// Hook para Produtos
export const useProdutos = () => {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      console.log('Buscando produtos...');
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }

      console.log('Produtos encontrados:', data?.length);
      return data as Produto[];
    },
  });
};

// Hook para Equipamentos
export const useEquipamentos = () => {
  return useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      console.log('Buscando equipamentos...');
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar equipamentos:', error);
        throw error;
      }

      console.log('Equipamentos encontrados:', data?.length);
      return data as Equipamento[];
    },
  });
};

// Hook para Tipos de Estabilidade
export const useTiposEstabilidade = () => {
  return useQuery({
    queryKey: ['tipos_estabilidade'],
    queryFn: async () => {
      console.log('Buscando tipos de estabilidade...');
      const { data, error } = await supabase
        .from('tipos_estabilidade')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar tipos de estabilidade:', error);
        throw error;
      }

      console.log('Tipos de estabilidade encontrados:', data?.length);
      
      // Converter os dados para o formato correto
      const tiposConvertidos = data?.map(tipo => ({
        ...tipo,
        periodos_retirada: convertJsonToPeriodos(tipo.periodos_retirada)
      })) as TipoEstabilidade[];

      return tiposConvertidos;
    },
  });
};

// Mutations para CRUD
export const useCreateProduto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto');
    },
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    },
  });
};

export const useCreateEquipamento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (equipamento: Omit<Equipamento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .insert(equipamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar equipamento:', error);
      toast.error('Erro ao criar equipamento');
    },
  });
};

export const useUpdateEquipamento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Equipamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar equipamento:', error);
      toast.error('Erro ao atualizar equipamento');
    },
  });
};

export const useCreateTipoEstabilidade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tipo: Omit<TipoEstabilidade, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('useCreateTipoEstabilidade - Dados recebidos:', tipo);
      console.log('useCreateTipoEstabilidade - Períodos:', tipo.periodos_retirada);
      
      const dataToInsert = {
        nome: tipo.nome,
        sigla: tipo.sigla,
        descricao: tipo.descricao,
        ativo: tipo.ativo,
        periodos_retirada: JSON.parse(JSON.stringify(tipo.periodos_retirada || []))
      };
      
      console.log('useCreateTipoEstabilidade - Dados para inserção:', dataToInsert);
      
      const { data, error } = await supabase
        .from('tipos_estabilidade')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tipo de estabilidade:', error);
        throw error;
      }
      
      console.log('Tipo criado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_estabilidade'] });
      toast.success('Tipo de estabilidade criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar tipo de estabilidade:', error);
      toast.error('Erro ao criar tipo de estabilidade');
    },
  });
};

export const useUpdateTipoEstabilidade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TipoEstabilidade> & { id: string }) => {
      console.log('useUpdateTipoEstabilidade - ID:', id);
      console.log('useUpdateTipoEstabilidade - Dados recebidos:', updates);
      console.log('useUpdateTipoEstabilidade - Períodos:', updates.periodos_retirada);

      const updateData: any = {
        nome: updates.nome,
        sigla: updates.sigla,
        descricao: updates.descricao,
        ativo: updates.ativo,
        updated_at: new Date().toISOString()
      };

      // Converter para Json compatível com Supabase
      updateData.periodos_retirada = JSON.parse(JSON.stringify(updates.periodos_retirada || []));

      console.log('useUpdateTipoEstabilidade - Dados para atualização:', updateData);

      const { data, error } = await supabase
        .from('tipos_estabilidade')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tipo de estabilidade:', error);
        throw error;
      }
      
      console.log('Tipo atualizado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_estabilidade'] });
      toast.success('Tipo de estabilidade atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar tipo de estabilidade:', error);
      toast.error('Erro ao atualizar tipo de estabilidade');
    },
  });
};
