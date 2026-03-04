
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Amostra, CronogramaItem } from '@/types/gestaoAmostras';

export const useGestaoAmostrasQueries = () => {
  // Buscar amostras com informações de retirada otimizada (resolve N+1 query)
  const { data: amostras = [], isLoading, error } = useQuery({
    queryKey: ['amostras-gestao'],
    queryFn: async () => {
      console.log('Buscando amostras para gestão...');
      
      // Query otimizada: buscar amostras com contagem de cronograma em uma única query
      const { data: amostrasData, error: amostrasError } = await supabase
        .from('amostras')
        .select(`
          *,
          produtos!amostras_tipo_controlado_fkey(id, nome, fabricante, codigo, principio_ativo, concentracao, forma_farmaceutica),
          equipamentos(id, nome, codigo, tipo, localizacao),
          tipos_estabilidade(nome, sigla, descricao),
          unidades!amostras_un_controlado_fkey(id, unidade),
          produtos_controlados:produtos!amostras_tipo_controlado_fkey(id, nome),
          cronograma_retiradas(id, realizada)
        `)
        .order('created_at', { ascending: false });

      if (amostrasError) {
        console.error('Erro ao buscar amostras:', amostrasError);
        throw amostrasError;
      }

      // Processar dados do cronograma já carregados (sem Promise.all)
      const amostrasComRetirada = (amostrasData || []).map((amostra: any) => {
        const cronograma = amostra.cronograma_retiradas || [];
        const totalVersoes = cronograma.length;
        const versoesRetiradas = cronograma.filter((item: any) => item.realizada === true).length;

        // Remove cronograma_retiradas do objeto final para manter compatibilidade
        const { cronograma_retiradas, ...amostraLimpa } = amostra;

        return {
          ...amostraLimpa,
          total_versoes: totalVersoes,
          versoes_retiradas: versoesRetiradas
        } as Amostra;
      });

      console.log('Amostras encontradas:', amostrasComRetirada.length);
      return amostrasComRetirada;
    },
    // Configuração otimizada de cache
    staleTime: 1 * 60 * 1000, // 1 minuto - dados considerados "frescos"
    gcTime: 10 * 60 * 1000, // 10 minutos - mantém em cache (gcTime no v5)
    refetchOnWindowFocus: false, // Evita refetch desnecessário
    refetchOnMount: true // Refetch ao montar componente para garantir dados atualizados
  });

  // Buscar tipos de estabilidade para filtro com cache otimizado
  const { data: tiposEstabilidade = [] } = useQuery({
    queryKey: ['tipos-estabilidade-filtro'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_estabilidade')
        .select('*')
        .eq('ativo', true);
      
      if (error) {
        console.error('Erro ao buscar tipos de estabilidade:', error);
        return [];
      }
      
      return data || [];
    },
    // Cache longo para dados que mudam raramente
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (gcTime no v5)
    refetchOnWindowFocus: false
  });

  // Buscar cronograma para uma amostra específica
  const buscarCronograma = async (amostraId: string): Promise<CronogramaItem[]> => {
    console.log('Buscando cronograma para amostra:', amostraId);
    const { data, error } = await supabase
      .from('cronograma_retiradas')
      .select('*')
      .eq('amostra_id', amostraId)
      .order('data_programada', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cronograma:', error);
      return [];
    }

    console.log('Cronograma encontrado:', data?.length || 0, 'itens');
    return data || [];
  };

  return {
    amostras,
    isLoading,
    error,
    tiposEstabilidade,
    buscarCronograma
  };
};
