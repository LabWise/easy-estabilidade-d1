
import { Amostra, AmostraComCronograma } from '@/types/gestaoAmostras';
import { useGestaoAmostrasQueries } from './useGestaoAmostrasQueries';
import { useGestaoAmostrasMutations } from './useGestaoAmostrasMutations';
import { useGestaoAmostrasFilters } from './useGestaoAmostrasFilters';
import { useGestaoAmostrasModalsComJustificativa } from './useGestaoAmostrasModalsComJustificativa';
import { useState, useMemo } from 'react';

export const useGestaoAmostras = () => {
  // Estado para modal de gestão de análises
  const [isAnalisesModalOpen, setIsAnalisesModalOpen] = useState(false);
  const [selectedAmostraAnalises, setSelectedAmostraAnalises] = useState<Amostra | null>(null);
  
  // Estado para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 50;

  // Queries
  const {
    amostras,
    isLoading,
    error,
    tiposEstabilidade,
    buscarCronograma
  } = useGestaoAmostrasQueries();

  // Mutations
  const {
    alterarStatusMutation,
    editarAmostraMutation
  } = useGestaoAmostrasMutations();

  // Filtros
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    amostrasFiltradas,
    handleExportCSV
  } = useGestaoAmostrasFilters(amostras);

  // Paginação das amostras filtradas
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const totalRegistros = amostrasFiltradas.length;
    const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
    
    return {
      itens: amostrasFiltradas.slice(inicio, fim),
      totalRegistros,
      totalPaginas
    };
  }, [amostrasFiltradas, paginaAtual, itensPorPagina]);

  // Modals
  const {
    selectedAmostra,
    isModalOpen,
    editingAmostra,
    isEditModalOpen,
    closeModal,
    closeEditModal,
    openViewModal,
    openEditModal,
    isJustificativaModalOpen,
    statusChangeData,
    openJustificativaModal,
    closeJustificativaModal,
    handleJustificativaConfirm
  } = useGestaoAmostrasModalsComJustificativa();

  // Handlers
  const handleStatusChange = (id: string, novoStatus: string) => {
    const amostra = amostras.find(a => a.id === id);
    if (!amostra) return;

    openJustificativaModal({
      amostraId: id,
      codigoAmostra: amostra.codigo,
      statusAtual: amostra.status || 'ativo',
      novoStatus,
      onConfirm: (justificativa: string) => {
        alterarStatusMutation.mutate({
          id,
          novoStatus,
          statusAtual: amostra.status || 'ativo',
          justificativa,
          usuarioAlteracao: 'Sistema' // TODO: Implementar usuário logado
        });
      }
    });
  };

  const handleView = (id: string) => {
    const amostra = amostras.find(a => a.id === id);
    if (amostra) {
      handleRowClick(amostra);
    }
  };

  const handleRowClick = async (amostra: Amostra) => {
    console.log('Clicou na amostra:', amostra.codigo);
    const cronograma = await buscarCronograma(amostra.id);
    const amostraComCronograma: AmostraComCronograma = {
      ...amostra,
      cronograma
    };
    openViewModal(amostraComCronograma);
  };

  const handleEdit = async (id: string) => {
    const amostra = amostras.find(a => a.id === id);
    if (amostra) {
      const cronograma = await buscarCronograma(amostra.id);
      const amostraComCronograma: AmostraComCronograma = {
        ...amostra,
        cronograma
      };
      openEditModal(amostraComCronograma);
    }
  };

  const handleSaveEdit = (amostraId: string, dadosAtualizados: any) => {
    editarAmostraMutation.mutate({ 
      id: amostraId, 
      dadosAtualizados 
    });
    
    // Fechar modal após salvar
    closeEditModal();
  };

  const handleGestaoAnalises = (amostra: Amostra) => {
    setSelectedAmostraAnalises(amostra);
    setIsAnalisesModalOpen(true);
  };

  const closeAnalisesModal = () => {
    setIsAnalisesModalOpen(false);
    setSelectedAmostraAnalises(null);
  };

  const handleSaveAnalises = () => {
    // Recarregar dados após salvar análises
    closeAnalisesModal();
  };

  return {
    // Estados
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    selectedAmostra,
    isModalOpen,
    editingAmostra,
    isEditModalOpen,
    
    // Estados do modal de análises
    isAnalisesModalOpen,
    selectedAmostraAnalises,
    closeAnalisesModal,
    handleSaveAnalises,
    
    // Estados do modal de justificativa
    isJustificativaModalOpen,
    statusChangeData,
    closeJustificativaModal,
    handleJustificativaConfirm,
    
    // Dados
    amostras,
    amostrasFiltradas,
    amostrasPaginadas: dadosPaginados.itens,
    tiposEstabilidade,
    isLoading,
    error,
    
    // Paginação
    paginaAtual,
    setPaginaAtual,
    totalRegistros: dadosPaginados.totalRegistros,
    totalPaginas: dadosPaginados.totalPaginas,
    itensPorPagina,
    
    // Mutations
    alterarStatusMutation,
    editarAmostraMutation,
    
    // Handlers
    handleExportCSV,
    handleStatusChange,
    handleView,
    handleRowClick,
    handleEdit,
    handleSaveEdit,
    handleGestaoAnalises,
    closeModal,
    closeEditModal
  };
};
