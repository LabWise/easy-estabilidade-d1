import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO } from 'date-fns';

export interface EquipamentMetrics {
  equipamento_nome: string;
  equipamento_id: string;
  pre_registro: number;
  pos_registro: number;
  total: number;
}

export interface FluxoMensal {
  mes: string;
  entradas: number;
  saidas: number;
  taxa_ocupacao: number;
}

export interface AnalisesPendentes {
  faixa_dias: string;
  quantidade: number;
  critico: boolean;
}

export interface StatusAmostras {
  status: string;
  quantidade: number;
  percentual: number;
}

export const useAnalyticsData = () => {
  // Gráfico 1: Amostras por Equipamento e Tipo de Estudo
  const { data: equipamentoMetrics, isLoading: loadingEquipamento } = useQuery({
    queryKey: ['analytics', 'equipamento-metrics'],
    queryFn: async (): Promise<EquipamentMetrics[]> => {
      const { data, error } = await supabase
        .from('amostras')
        .select(`
          equipamentos!inner(id, nome),
          tipo_registro,
          id
        `)
        .not('equipamentos', 'is', null);

      if (error) throw error;

      const metrics = data.reduce((acc: Record<string, any>, item) => {
        const equipId = item.equipamentos.id;
        const equipNome = item.equipamentos.nome;
        
        if (!acc[equipId]) {
          acc[equipId] = {
            equipamento_nome: equipNome,
            equipamento_id: equipId,
            pre_registro: 0,
            pos_registro: 0,
            total: 0
          };
        }
        
        if (item.tipo_registro === 'pre-registro') {
          acc[equipId].pre_registro++;
        } else if (item.tipo_registro === 'pos-registro') {
          acc[equipId].pos_registro++;
        }
        acc[equipId].total++;
        
        return acc;
      }, {});

      return Object.values(metrics);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Gráfico 2: Fluxo Mensal (Entrada vs Saída)
  const { data: fluxoMensal, isLoading: loadingFluxo } = useQuery({
    queryKey: ['analytics', 'fluxo-mensal'],
    queryFn: async (): Promise<FluxoMensal[]> => {
      const dataLimite = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      
      // Buscar entradas
      const { data: entradas, error: errorEntradas } = await supabase
        .from('amostras')
        .select('data_entrada')
        .gte('data_entrada', dataLimite);

      if (errorEntradas) throw errorEntradas;

      // Buscar saídas
      const { data: saidas, error: errorSaidas } = await supabase
        .from('retiradas_amostras')
        .select('data_retirada')
        .gte('data_retirada', dataLimite);

      if (errorSaidas) throw errorSaidas;

      // Agrupar por mês
      const meses: Record<string, { entradas: number; saidas: number }> = {};
      
      entradas?.forEach(item => {
        const mes = format(parseISO(item.data_entrada), 'yyyy-MM');
        if (!meses[mes]) meses[mes] = { entradas: 0, saidas: 0 };
        meses[mes].entradas++;
      });

      saidas?.forEach(item => {
        const mes = format(parseISO(item.data_retirada), 'yyyy-MM');
        if (!meses[mes]) meses[mes] = { entradas: 0, saidas: 0 };
        meses[mes].saidas++;
      });

      return Object.entries(meses)
        .map(([mes, dados]) => ({
          mes: format(parseISO(`${mes}-01`), 'MMM/yy'),
          entradas: dados.entradas,
          saidas: dados.saidas,
          taxa_ocupacao: dados.entradas > 0 ? (dados.saidas / dados.entradas) * 100 : 0
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Gráfico 3: Análises por Tempo de Espera
  const { data: analisesPendentes, isLoading: loadingAnalises } = useQuery({
    queryKey: ['analytics', 'analises-pendentes'],
    queryFn: async (): Promise<AnalisesPendentes[]> => {
      const { data, error } = await supabase
        .from('status_analises_amostras')
        .select('created_at, status')
        .in('status', ['pendente', 'em_andamento']);

      if (error) throw error;

      const hoje = new Date();
      const faixas = {
        '0-10 dias': 0,
        '11-20 dias': 0,
        '21-30 dias': 0,
        '>30 dias': 0
      };

      data?.forEach(item => {
        const diasEspera = Math.floor((hoje.getTime() - parseISO(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasEspera <= 10) faixas['0-10 dias']++;
        else if (diasEspera <= 20) faixas['11-20 dias']++;
        else if (diasEspera <= 30) faixas['21-30 dias']++;
        else faixas['>30 dias']++;
      });

      return Object.entries(faixas).map(([faixa, quantidade]) => ({
        faixa_dias: faixa,
        quantidade,
        critico: faixa.includes('>30') || faixa.includes('21-30')
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Gráfico 4: Status das Amostras (Quarentena vs Análise)
  const { data: statusAmostras, isLoading: loadingStatus } = useQuery({
    queryKey: ['analytics', 'status-amostras'],
    queryFn: async (): Promise<StatusAmostras[]> => {
      // Amostras retiradas (quarentena = retirada mas sem análise iniciada)
      const { data: retiradas, error: errorRetiradas } = await supabase
        .from('amostras')
        .select(`
          id,
          status,
          status_analises_amostras(status)
        `)
        .eq('status', 'retirada');

      if (errorRetiradas) throw errorRetiradas;

      // Análises em andamento
      const { data: analises, error: errorAnalises } = await supabase
        .from('status_analises_amostras')
        .select('status')
        .in('status', ['em_andamento', 'pendente']);

      if (errorAnalises) throw errorAnalises;

      const quarentena = retiradas?.filter(r => 
        !r.status_analises_amostras?.length || 
        r.status_analises_amostras.every(a => a.status === 'pendente')
      ).length || 0;

      const emAnalise = analises?.filter(a => a.status === 'em_andamento').length || 0;
      const pendentes = analises?.filter(a => a.status === 'pendente').length || 0;

      const total = quarentena + emAnalise + pendentes;

      return [
        { 
          status: 'Quarentena', 
          quantidade: quarentena, 
          percentual: total > 0 ? (quarentena / total) * 100 : 0 
        },
        { 
          status: 'Em Análise', 
          quantidade: emAnalise, 
          percentual: total > 0 ? (emAnalise / total) * 100 : 0 
        },
        { 
          status: 'Pendente', 
          quantidade: pendentes, 
          percentual: total > 0 ? (pendentes / total) * 100 : 0 
        }
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    equipamentoMetrics,
    fluxoMensal,
    analisesPendentes,
    statusAmostras,
    isLoading: loadingEquipamento || loadingFluxo || loadingAnalises || loadingStatus
  };
};