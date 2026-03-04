
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGestaoAmostrasMutations = () => {
  const queryClient = useQueryClient();

  // Mutation para alterar status da amostra
  const alterarStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      novoStatus, 
      statusAtual, 
      justificativa, 
      usuarioAlteracao 
    }: { 
      id: string; 
      novoStatus: string; 
      statusAtual?: string;
      justificativa: string;
      usuarioAlteracao: string;
    }) => {
      // Atualizar status da amostra
      const { data: amostraData, error: amostraError } = await supabase
        .from('amostras')
        .update({ status: novoStatus })
        .eq('id', id)
        .select();

      if (amostraError) throw amostraError;

      // Salvar histórico da alteração
      const { error: historicoError } = await supabase
        .from('historico_status_amostras')
        .insert({
          amostra_id: id,
          status_anterior: statusAtual,
          status_novo: novoStatus,
          justificativa,
          usuario_alteracao: usuarioAlteracao
        });

      if (historicoError) throw historicoError;

      return amostraData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amostras-gestao'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-amostras'] });
      toast({
        title: 'Sucesso!',
        description: 'Status da amostra atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar status: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation para editar amostra
  const editarAmostraMutation = useMutation({
    mutationFn: async ({ id, dadosAtualizados }: { id: string; dadosAtualizados: any }) => {
      // Buscar dados atuais da amostra para verificar se amostra_extra está mudando
      const { data: amostraAtual, error: erroAtual } = await supabase
        .from('amostras')
        .select('amostra_extra, codigo, data_entrada')
        .eq('id', id)
        .single();

      if (erroAtual) throw erroAtual;

      const { data, error } = await supabase
        .from('amostras')
        .update(dadosAtualizados)
        .eq('id', id)
        .select();

      if (error) throw error;

      // Se amostra_extra mudou de false para true, criar versão extra
      if (!amostraAtual.amostra_extra && dadosAtualizados.amostra_extra === true) {
        const { error: extraError } = await supabase
          .rpc('adicionar_versao_extra_com_codigo_unico', {
            p_amostra_id: id,
            p_codigo_base: amostraAtual.codigo,
            p_data_entrada: amostraAtual.data_entrada
          });

        if (extraError) throw extraError;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amostras-gestao'] });
      toast({
        title: 'Sucesso!',
        description: 'Amostra atualizada com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar amostra: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  return {
    alterarStatusMutation,
    editarAmostraMutation
  };
};
