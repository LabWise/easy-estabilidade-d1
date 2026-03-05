import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';

interface ProximaRetirada {
  id: string;
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  realizada: boolean;
  amostras: {
    id: string;
    codigo: string;
    lote: string;
    produtos?: {
      nome: string;
    };
    tipos_estabilidade?: {
      sigla: string;
    };
  };
}

export const useProximasRetiradas = () => {
  // Estado para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 50;

  // Estado para ordenação
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const { data: proximasRetiradas, isLoading } = useQuery({
    queryKey: ['proximas-retiradas'],
    queryFn: async (): Promise<ProximaRetirada[]> => {
      const { data, error } = await supabase
        .from('cronograma_retiradas')
        .select(`
          id,
          codigo_versao,
          tempo_coleta,
          data_programada,
          realizada,
          amostras (
            id,
            codigo,
            lote,
            produtos (
              nome
            ),
            tipos_estabilidade (
              sigla
            )
          )
        `)
        .eq('realizada', false)
        .order('data_programada', { ascending: true });

      if (error) {
        console.error('Erro ao buscar próximas retiradas:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para ordenar dados
  const dadosOrdenados = useMemo(() => {
    if (!proximasRetiradas || !sortField || !sortDirection) {
      return proximasRetiradas || [];
    }

    const sorted = [...proximasRetiradas].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'codigo_versao':
          aValue = a.codigo_versao || '';
          bValue = b.codigo_versao || '';
          break;
        case 'codigo_amostra':
          aValue = a.amostras?.codigo || '';
          bValue = b.amostras?.codigo || '';
          break;
        case 'tempo_coleta':
          aValue = a.tempo_coleta || '';
          bValue = b.tempo_coleta || '';
          break;
        case 'data_programada':
          aValue = new Date(a.data_programada).getTime();
          bValue = new Date(b.data_programada).getTime();
          break;
        case 'lote':
          aValue = a.amostras?.lote || '';
          bValue = b.amostras?.lote || '';
          break;
        case 'produto':
          aValue = a.amostras?.produtos?.nome || '';
          bValue = b.amostras?.produtos?.nome || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [proximasRetiradas, sortField, sortDirection]);

  // Função para alternar ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, alternar direção
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // Novo campo, começar com ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Paginação dos dados ordenados
  const dadosPaginados = useMemo(() => {
    const dados = dadosOrdenados;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const totalRegistros = dados.length;
    const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
    
    return {
      itens: dados.slice(inicio, fim),
      totalRegistros,
      totalPaginas
    };
  }, [dadosOrdenados, paginaAtual, itensPorPagina]);

  return {
    proximasRetiradas,
    proximasRetiradasPaginadas: dadosPaginados.itens,
    isLoading,
    paginaAtual,
    setPaginaAtual,
    totalRegistros: dadosPaginados.totalRegistros,
    totalPaginas: dadosPaginados.totalPaginas,
    itensPorPagina,
    // Ordenação
    sortField,
    sortDirection,
    handleSort
  };
};