
import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { FiltrosAmostras } from '../components/GestaoAmostras/FiltrosAmostras';
import { TabelaAmostras } from '../components/GestaoAmostras/TabelaAmostras';
import { EstadosCarregamento } from '../components/GestaoAmostras/EstadosCarregamento';
import { ModalDetalhesAmostra } from '../components/ModalDetalhesAmostra';
import { FormularioEdicaoAmostra } from '../components/GestaoAmostras/FormularioEdicaoAmostra';
import { ModalJustificativaStatus } from '../components/ModalJustificativaStatus';
import { ModalGestaoAnalises } from '../components/GestaoAmostras/ModalGestaoAnalises';
import { useGestaoAmostras } from '../hooks/useGestaoAmostras';
import { PaginacaoRelatorio } from '../components/Relatorios/PaginacaoRelatorio';

const GestaoAmostras = () => {
  const {
    amostras,
    amostrasFiltradas,
    amostrasPaginadas,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    tiposEstabilidade,
    selectedAmostra,
    isModalOpen,
    editingAmostra,
    isEditModalOpen,
    isAnalisesModalOpen,
    selectedAmostraAnalises,
    closeAnalisesModal,
    handleSaveAnalises,
    isJustificativaModalOpen,
    statusChangeData,
    closeJustificativaModal,
    handleJustificativaConfirm,
    alterarStatusMutation,
    editarAmostraMutation,
    handleExportCSV,
    handleStatusChange,
    handleView,
    handleRowClick,
    handleEdit,
    handleSaveEdit,
    handleGestaoAnalises,
    closeModal,
    closeEditModal,
    // Paginação
    paginaAtual,
    setPaginaAtual,
    totalRegistros,
    totalPaginas,
    itensPorPagina
  } = useGestaoAmostras();

  if (isLoading || error) {
    return <EstadosCarregamento isLoading={isLoading} error={error} />;
  }

  return (
    <ResponsiveLayout title="Gestão de Amostras">
      <div className="space-y-6">
        <FiltrosAmostras 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          tiposEstabilidade={tiposEstabilidade}
          onExportCSV={handleExportCSV}
        />
        
        <TabelaAmostras 
          amostras={amostrasPaginadas}
          onRowClick={handleRowClick}
          onView={handleView}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onGestaoAnalises={handleGestaoAnalises}
          isStatusChanging={alterarStatusMutation.isPending}
        />

        <PaginacaoRelatorio
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          setPaginaAtual={setPaginaAtual}
          totalRegistros={totalRegistros}
          itensPorPagina={itensPorPagina}
        />

        <ModalDetalhesAmostra
          amostra={selectedAmostra}
          isOpen={isModalOpen}
          onClose={closeModal}
        />

        <FormularioEdicaoAmostra
          amostra={editingAmostra}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
          isSaving={editarAmostraMutation.isPending}
        />

        <ModalGestaoAnalises
          amostra={selectedAmostraAnalises}
          isOpen={isAnalisesModalOpen}
          onClose={closeAnalisesModal}
          onSave={handleSaveAnalises}
        />

        <ModalJustificativaStatus
          isOpen={isJustificativaModalOpen}
          onClose={closeJustificativaModal}
          onConfirm={handleJustificativaConfirm}
          statusAtual={statusChangeData?.statusAtual || ''}
          novoStatus={statusChangeData?.novoStatus || ''}
          codigoAmostra={statusChangeData?.codigoAmostra || ''}
          isLoading={alterarStatusMutation.isPending}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default GestaoAmostras;
