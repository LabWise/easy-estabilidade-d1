
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { amostraService } from '@/services/amostraService';
import { useFormData } from './useFormData';
import { useCronogramaCalculation } from './useCronogramaCalculation';
import { TipoEstabilidade, Equipamento, CronogramaItem } from '@/types/amostra';
import { AmostraComCronograma } from '@/types/gestaoAmostras';

export const useEntradaAmostras = () => {
  const queryClient = useQueryClient();
  const [showEtiquetas, setShowEtiquetas] = useState(false);
  const [cronogramaGerado, setCronogramaGerado] = useState<CronogramaItem[]>([]);
  const [amostrasCriadas, setAmostrasCriadas] = useState<any[]>([]);

  // Buscar próximo código de amostra
  const { data: proximoCodigo } = useQuery({
    queryKey: ['proximo-codigo'],
    queryFn: amostraService.gerarProximoCodigo
  });

  // Buscar tipos de estabilidade
  const { data: tiposEstabilidade = [] } = useQuery({
    queryKey: ['tipos-estabilidade-ativos'],
    queryFn: amostraService.buscarTiposEstabilidade
  });

  // Buscar equipamentos
  const { data: equipamentos = [] } = useQuery({
    queryKey: ['equipamentos-ativos'],
    queryFn: amostraService.buscarEquipamentos
  });

  // Form data management
  const { formData, setFormData, handleReset } = useFormData(proximoCodigo);

  // Cronograma calculation
  const { calcularDatasRetirada } = useCronogramaCalculation(formData, tiposEstabilidade);

  // Função para converter dados para o formato do modal
  const converterParaAmostraComCronograma = (): AmostraComCronograma | null => {
    if (amostrasCriadas.length === 0 || cronogramaGerado.length === 0) return null;
    
    const amostra = amostrasCriadas[0];
    const cronogramaFormatado = cronogramaGerado.map(item => ({
      id: item.codigo_versao,
      codigo_versao: item.codigo_versao,
      tempo_coleta: item.tempo_coleta,
      data_programada: item.data_programada,
      data_realizada: undefined,
      realizada: false,
      quantidade_retirada: undefined,
      observacoes: undefined
    }));

    return {
      ...amostra,
      cronograma: cronogramaFormatado
    };
  };

  // Mutation para criar amostra
  const criarAmostraMutation = useMutation({
    mutationFn: async ({ dadosAmostra, analisesIds, formData }: { dadosAmostra: any; analisesIds?: string[]; formData?: any }) => {
      return amostraService.criarAmostra(dadosAmostra, tiposEstabilidade, analisesIds, formData);
    },
    onSuccess: (data) => {
      console.log('Amostra criada com sucesso:', data);
      
      const totalEtiquetas = data.cronograma.length;
      
      toast({
        title: 'Sucesso!',
        description: `Amostra cadastrada com ${totalEtiquetas} etiquetas geradas!`
      });
      
      // Mapear cronograma para o formato esperado pelo modal
      const cronogramaFormatado = data.cronograma.map((item: any) => ({ 
        ...item, 
        amostra: data.amostra 
      }));
      
      setCronogramaGerado(cronogramaFormatado);
      setAmostrasCriadas([data.amostra]);
      
      // Invalidar queries para atualizar listas
      queryClient.invalidateQueries({ queryKey: ['amostras'] });
      queryClient.invalidateQueries({ queryKey: ['amostras-gestao'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-amostras'] });
      queryClient.invalidateQueries({ queryKey: ['proximo-codigo'] });
      
      // Abrir modal de impressão automaticamente
      setShowEtiquetas(true);
      
      // Resetar formulário
      handleReset();
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar amostra:', error);
      toast({
        title: 'Erro',
        description: `Erro ao cadastrar amostra: ${error.message || 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    }
  });

  return {
    formData,
    setFormData,
    tiposEstabilidade: tiposEstabilidade as TipoEstabilidade[],
    equipamentos: equipamentos as Equipamento[],
    criarAmostraMutation,
    handleReset,
    calcularDatasRetirada,
    showEtiquetas,
    setShowEtiquetas,
    cronogramaGerado,
    amostrasCriadas,
    converterParaAmostraComCronograma
  };
};

// Export the types for backward compatibility
export type { FormData } from '@/types/amostra';
