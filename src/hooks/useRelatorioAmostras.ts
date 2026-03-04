
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, parseISO } from 'date-fns';

export interface AmostraComCronograma {
  id: string;
  codigo: string;
  lote: string;
  nome_produto: string | null;
  fabricante: string | null;
  data_entrada: string;
  status: string | null;
  produtos?: {
    nome: string;
    fabricante: string;
  } | null;
  equipamentos?: {
    nome: string;
  } | null;
  tipos_estabilidade?: {
    nome: string;
    sigla: string;
  } | null;
    cronograma_retiradas: Array<{
      id: string;
      codigo_versao: string | null;
      tempo_coleta: string;
      data_programada: string;
      data_realizada: string | null;
      realizada: boolean | null;
      quantidade_retirada: number | null;
      observacoes: string | null;
    }>;
    retiradas_amostras: Array<{
      id: string;
      usuario_retirada: string;
      data_retirada: string;
      status_textual: string;
      metodo_identificacao: string;
      observacoes: string | null;
    }> | null;
}

type FiltroRapido = '7dias' | '15dias' | '30dias' | 'personalizado' | 'todos';

export const useRelatorioAmostras = () => {
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('todos');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar amostras com cronograma
  const { data: amostrasComCronograma = [], isLoading, error } = useQuery({
    queryKey: ['relatorio-amostras'],
    queryFn: async () => {
      console.log('Buscando amostras com cronograma para relatório...');
      const { data, error } = await supabase
        .from('amostras')
        .select(`
          id,
          codigo,
          lote,
          nome_produto,
          fabricante,
          data_entrada,
          status,
          produtos(nome, fabricante),
          equipamentos(nome),
          tipos_estabilidade(nome, sigla),
          cronograma_retiradas(
            id,
            codigo_versao,
            tempo_coleta,
            data_programada,
            data_realizada,
            realizada,
            quantidade_retirada,
            observacoes
          ),
          retiradas_amostras(
            id,
            usuario_retirada,
            data_retirada,
            status_textual,
            metodo_identificacao,
            observacoes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar amostras com cronograma:', error);
        throw error;
      }

      console.log('Amostras com cronograma encontradas:', data?.length || 0);
      return data as AmostraComCronograma[];
    }
  });

  // Estado para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 50;

  // Aplicar filtros primeiro
  const dadosFiltrados = useMemo(() => {
    let amostrasParaFiltrar = amostrasComCronograma;

    // Filtro de busca por texto
    if (searchTerm) {
      amostrasParaFiltrar = amostrasParaFiltrar.filter(amostra =>
        amostra.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amostra.produtos?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amostra.nome_produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amostra.lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amostra.produtos?.fabricante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amostra.fabricante?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de data baseado no tipo selecionado
    const hoje = new Date();
    let dataInicioFiltro: Date | undefined;
    let dataFimFiltro: Date | undefined;

    switch (filtroRapido) {
      case '7dias':
        dataInicioFiltro = hoje;
        dataFimFiltro = addDays(hoje, 7);
        break;
      case '15dias':
        dataInicioFiltro = hoje;
        dataFimFiltro = addDays(hoje, 15);
        break;
      case '30dias':
        dataInicioFiltro = hoje;
        dataFimFiltro = addDays(hoje, 30);
        break;
      case 'personalizado':
        dataInicioFiltro = dataInicio;
        dataFimFiltro = dataFim;
        break;
      case 'todos':
        // Mostrar todas as amostras sem filtro de data
        dataInicioFiltro = undefined;
        dataFimFiltro = undefined;
        break;
    }

    // Filtrar cronogramas baseado nas datas
    const amostrasComCronogramaFiltrado = amostrasParaFiltrar.map(amostra => ({
      ...amostra,
      cronograma_retiradas: amostra.cronograma_retiradas.filter(cronograma => {
        if (!dataInicioFiltro || !dataFimFiltro) return true;
        
        const dataProgramada = parseISO(cronograma.data_programada);
        return dataProgramada >= dataInicioFiltro && dataProgramada <= dataFimFiltro;
      })
    }));

    // Remover amostras sem cronograma após filtro de data (exceto quando for 'todos')
    if (filtroRapido !== 'todos') {
      return amostrasComCronogramaFiltrado.filter(amostra => 
        amostra.cronograma_retiradas.length > 0
      );
    }

    return amostrasComCronogramaFiltrado;
  }, [amostrasComCronograma, filtroRapido, dataInicio, dataFim, searchTerm]);

  // Expandir dados para mostrar cada linha de cronograma (movido do componente)
  const dadosExpandidos = useMemo(() => {
    return dadosFiltrados.flatMap(amostra => {
      if (amostra.cronograma_retiradas.length === 0) {
        return [{
          ...amostra,
          cronograma: null
        }];
      }
      
      return amostra.cronograma_retiradas.map(cronograma => ({
        ...amostra,
        cronograma
      }));
    });
  }, [dadosFiltrados]);

  // Dados paginados (agora paginando os dados expandidos)
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return dadosExpandidos.slice(inicio, fim);
  }, [dadosExpandidos, paginaAtual]);

  const totalPaginas = Math.ceil(dadosExpandidos.length / itensPorPagina);

  // Exportar CSV
  const handleExportCSV = () => {
    const hoje = new Date();
    const dataFormatada = format(hoje, 'dd/MM/yyyy');
    const horaFormatada = format(hoje, 'HH:mm');
    
    // Cabeçalho do relatório
    const cabecalho = [
      ['EASY ESTABILIDADE - RELATÓRIO DE AMOSTRAS'],
      [`Data de Geração: ${dataFormatada} às ${horaFormatada}`],
      [''],
      ['Código Versão', 'Produto', 'Lote', 'Fabricante', 'Tipo Estabilidade', 'Equipamento', 'Status', 'Tempo Coleta', 'Data Programada', 'Data Realizada', 'Realizada', 'Quantidade Retirada', 'Observações', 'Retirada Por', 'Data Retirada', 'Status na Retirada', 'Método Identificação']
    ];

    const csvData: string[][] = [...cabecalho];

    dadosFiltrados.forEach(amostra => {
      const retirada = amostra.retiradas_amostras?.[0]; // Só pode ter uma retirada por amostra
      
      if (amostra.cronograma_retiradas.length > 0) {
        amostra.cronograma_retiradas.forEach(cronograma => {
          csvData.push([
            cronograma.codigo_versao || amostra.codigo,
            amostra.produtos?.nome || amostra.nome_produto || '',
            amostra.lote,
            amostra.produtos?.fabricante || amostra.fabricante || '',
            amostra.tipos_estabilidade?.sigla || '',
            amostra.equipamentos?.nome || '',
            amostra.status || 'ativo',
            cronograma.tempo_coleta,
            format(parseISO(cronograma.data_programada), 'dd/MM/yyyy'),
            cronograma.data_realizada ? format(parseISO(cronograma.data_realizada), 'dd/MM/yyyy') : '',
            cronograma.realizada ? 'Sim' : 'Não',
            cronograma.quantidade_retirada?.toString() || '',
            cronograma.observacoes || '',
            retirada?.usuario_retirada || '',
            retirada ? format(parseISO(retirada.data_retirada), 'dd/MM/yyyy HH:mm') : '',
            retirada?.status_textual || '',
            retirada?.metodo_identificacao || ''
          ]);
        });
      } else {
        // Amostra sem cronograma
        csvData.push([
          amostra.codigo,
          amostra.produtos?.nome || amostra.nome_produto || '',
          amostra.lote,
          amostra.produtos?.fabricante || amostra.fabricante || '',
          amostra.tipos_estabilidade?.sigla || '',
          amostra.equipamentos?.nome || '',
          amostra.status || 'ativo',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          retirada?.usuario_retirada || '',
          retirada ? format(parseISO(retirada.data_retirada), 'dd/MM/yyyy HH:mm') : '',
          retirada?.status_textual || '',
          retirada?.metodo_identificacao || ''
        ]);
      }
    });

    // Adicionar rodapé
    csvData.push(['']);
    csvData.push([`Total de registros: ${dadosFiltrados.length}`]);

    // Criar CSV com encoding UTF-8 correto
    const csvContent = '\uFEFF' + csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Easy_Estabilidade_Relatorio_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  return {
    dadosFiltrados,
    dadosExpandidos,
    dadosPaginados,
    isLoading,
    error,
    filtroRapido,
    setFiltroRapido,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    searchTerm,
    setSearchTerm,
    handleExportCSV,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    itensPorPagina
  };
};
