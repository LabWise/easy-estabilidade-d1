
import { useState } from 'react';
import { AmostraComCronograma } from '@/types/gestaoAmostras';

export const useGestaoAmostrasModals = () => {
  const [selectedAmostra, setSelectedAmostra] = useState<AmostraComCronograma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmostra, setEditingAmostra] = useState<AmostraComCronograma | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  return {
    selectedAmostra,
    isModalOpen,
    editingAmostra,
    isEditModalOpen,
    closeModal,
    closeEditModal,
    openViewModal,
    openEditModal
  };
};
