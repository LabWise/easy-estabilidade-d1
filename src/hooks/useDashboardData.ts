
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, addDays } from 'date-fns';
import { useAuth } from './useAuth';

export const useDashboardData = () => {
  const { user, isAuthenticated } = useAuth();

  // Buscar estatísticas gerais das versões (etiquetas) - Cache SWR
  const { data: estatisticasGerais, isLoading: loadingEstatisticas } = useQuery({
    queryKey: ['dashboard-estatisticas'],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutos stale
    gcTime: 5 * 60 * 1000, // 5 minutos cache
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log('Buscando estatísticas gerais do dashboard (versões)...');
      
      // Total de versões (cronograma_retiradas) - RLS filtra por empresa automaticamente
      const { count: totalVersoes, error: errorTotal } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true });

      if (errorTotal) {
        console.error('Erro ao buscar total de versões:', errorTotal);
        throw errorTotal;
      }

      // Versões ativas (de amostras ativas) - RLS filtra por empresa automaticamente
      const { count: versoesAtivas, error: errorAtivas } = await supabase
        .from('cronograma_retiradas')
        .select('*, amostras!inner(status, finalizada)', { count: 'exact', head: true })
        .eq('amostras.status', 'ativo')
        .eq('amostras.finalizada', false);

      if (errorAtivas) {
        console.error('Erro ao buscar versões ativas:', errorAtivas);
        throw errorAtivas;
      }

      // Versões dos últimos 30 dias - RLS filtra por empresa automaticamente
      const dataLimite30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { count: versoes30Dias, error: error30Dias } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dataLimite30);

      if (error30Dias) {
        console.error('Erro ao buscar versões dos últimos 30 dias:', error30Dias);
        throw error30Dias;
      }

      // Versões dos últimos 7 dias - RLS filtra por empresa automaticamente
      const dataLimite7 = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { count: versoes7Dias, error: error7Dias } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dataLimite7);

      if (error7Dias) {
        console.error('Erro ao buscar versões dos últimos 7 dias:', error7Dias);
        throw error7Dias;
      }

      // Calcular percentuais
      const percentual30Dias = totalVersoes ? Math.round((versoes30Dias! / totalVersoes) * 100) : 0;
      const percentual7Dias = totalVersoes ? Math.round((versoes7Dias! / totalVersoes) * 100) : 0;

      console.log('Estatísticas de versões calculadas:', {
        totalVersoes,
        versoesAtivas,
        versoes30Dias,
        versoes7Dias,
        percentual30Dias,
        percentual7Dias
      });

      return {
        totalAmostras: totalVersoes || 0,
        amostrasAtivas: versoesAtivas || 0,
        amostras30Dias: versoes30Dias || 0,
        amostras7Dias: versoes7Dias || 0,
        percentual30Dias,
        percentual7Dias
      };
    }
  });

  // Buscar próximas retiradas (próximos 30 dias) - Cache SWR
  const { data: proximasRetiradas, isLoading: loadingRetiradas } = useQuery({
    queryKey: ['dashboard-proximas-retiradas'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos stale
    gcTime: 10 * 60 * 1000, // 10 minutos cache  
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log('Buscando próximas retiradas...');
      
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const dataLimite = format(addDays(new Date(), 30), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('cronograma_retiradas')
        .select(`
          *,
          amostras(
            codigo,
            nome_produto,
            lote,
            tipos_estabilidade(nome, sigla)
          )
        `)
        .eq('realizada', false)
        .gte('data_programada', hoje)
        .lte('data_programada', dataLimite)
        .order('data_programada', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar próximas retiradas:', error);
        throw error;
      }

      console.log('Próximas retiradas encontradas:', data?.length || 0);
      return data || [];
    }
  });

  // Buscar estatísticas de conformidade - Cache SWR
  const { data: estatisticasConformidade, isLoading: loadingConformidade } = useQuery({
    queryKey: ['dashboard-conformidade'],
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutos stale
    gcTime: 8 * 60 * 1000, // 8 minutos cache
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log('Buscando estatísticas de conformidade...');
      
      // Total de retiradas programadas - RLS filtra por empresa automaticamente
      const { count: totalProgramadas, error: errorTotal } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true });

      if (errorTotal) {
        console.error('Erro ao buscar total de retiradas programadas:', errorTotal);
        throw errorTotal;
      }

      // Retiradas realizadas - RLS filtra por empresa automaticamente
      const { count: realizadas, error: errorRealizadas } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true })
        .eq('realizada', true);

      if (errorRealizadas) {
        console.error('Erro ao buscar retiradas realizadas:', errorRealizadas);
        throw errorRealizadas;
      }

      // Retiradas em atraso (data programada já passou e não foi realizada) - RLS filtra por empresa automaticamente
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const { count: emAtraso, error: errorAtraso } = await supabase
        .from('cronograma_retiradas')
        .select('*', { count: 'exact', head: true })
        .eq('realizada', false)
        .lt('data_programada', hoje);

      if (errorAtraso) {
        console.error('Erro ao buscar retiradas em atraso:', errorAtraso);
        throw errorAtraso;
      }

      const taxaConformidade = totalProgramadas ? 
        Math.round(((realizadas! / totalProgramadas) * 100) * 100) / 100 : 0;

      console.log('Estatísticas de conformidade calculadas:', {
        totalProgramadas,
        realizadas,
        emAtraso,
        taxaConformidade
      });

      return {
        totalProgramadas: totalProgramadas || 0,
        realizadas: realizadas || 0,
        emAtraso: emAtraso || 0,
        taxaConformidade
      };
    }
  });

  return {
    estatisticasGerais,
    proximasRetiradas,
    estatisticasConformidade,
    isLoading: loadingEstatisticas || loadingRetiradas || loadingConformidade
  };
};
