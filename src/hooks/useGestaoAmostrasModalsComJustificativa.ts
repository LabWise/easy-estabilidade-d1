import { useState } from 'react';
import { AmostraComCronograma } from '@/types/gestaoAmostras';

export const useGestaoAmostrasModalsComJustificativa = () => {
  const [selectedAmostra, setSelectedAmostra] = useState<AmostraComCronograma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmostra, setEditingAmostra] = useState<AmostraComCronograma | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para modal de justificativa
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{
    amostraId: string;
    codigoAmostra: string;
    statusAtual: string;
    novoStatus: string;
    onConfirm: (justificativa: string) => void;
  } | null>(null);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAmostra(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAmostra(null);
  };

  const openViewModal = (amostra: AmostraComCronograma) => {
    setSelectedAmostra(amostra);
    setIsModalOpen(true);
  };

  const openEditModal = (amostra: AmostraComCronograma) => {
    setEditingAmostra(amostra);
    setIsEditModalOpen(true);
  };

  const openJustificativaModal = (data: {
    amostraId: string;
    codigoAmostra: string;
    statusAtual: string;
    novoStatus: string;
    onConfirm: (justificativa: string) => void;
  }) => {
    setStatusChangeData(data);
    setIsJustificativaModalOpen(true);
  };

  const closeJustificativaModal = () => {
    setIsJustificativaModalOpen(false);
    setStatusChangeData(null);
  };

  const handleJustificativaConfirm = (justificativa: string) => {
    if (statusChangeData) {
      statusChangeData.onConfirm(justificativa);
      closeJustificativaModal();
    }
  };

  return {
    selectedAmostra,
    isModalOpen,
    editingAmostra,
    isEditModalOpen,
    closeModal,
    closeEditModal,
    openViewModal,
    openEditModal,
    
    // Estados do modal de justificativa
    isJustificativaModalOpen,
    statusChangeData,
    openJustificativaModal,
    closeJustificativaModal,
    handleJustificativaConfirm
  };
};