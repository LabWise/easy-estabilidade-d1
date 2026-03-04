
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { Amostra } from '@/types/gestaoAmostras';
import { format } from 'date-fns';

export const useGestaoAmostrasFilters = (amostras: Amostra[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Debounce da busca para evitar múltiplas execuções
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Filtrar amostras com useMemo para otimização de performance
  const amostrasFiltradas = useMemo(() => {
    return amostras.filter(amostra => {
      const matchesSearch = 
        amostra.codigo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        amostra.produtos?.nome?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        amostra.nome_produto?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        amostra.lote?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        amostra.produtos?.fabricante?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        amostra.fabricante?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || amostra.tipo_estabilidade_id === filterType;
      const matchesStatus = filterStatus === 'all' || amostra.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [amostras, debouncedSearchTerm, filterType, filterStatus]);

  const handleExportCSV = useMemo(() => {
    return () => {
      const csvContent = [
        ['Código', 'Produto', 'Lote', 'Fabricante', 'Tipo', 'Data Entrada', 'Status', 'Extra', 'Equipamento', 'Temperatura', 'Umidade', 'Quantidade Atual', 'Data Fabricação', 'Data Vencimento', 'Cliente', 'Observações'],
        ...amostrasFiltradas.map(amostra => [
          amostra.codigo,
          amostra.produtos?.nome || amostra.nome_produto || '',
          amostra.lote,
          amostra.produtos?.fabricante || amostra.fabricante || '',
          amostra.tipos_estabilidade?.sigla || '',
          format(new Date(amostra.data_entrada), 'dd/MM/yyyy'),
          amostra.status || 'ativo',
          amostra.amostra_extra ? 'Sim' : 'Não',
          amostra.equipamentos?.nome || '',
          amostra.temperatura ? `${amostra.temperatura}°C` : '',
          amostra.umidade ? `${amostra.umidade}%` : '',
          amostra.quantidade_atual || '',
          amostra.data_fabricacao ? format(new Date(amostra.data_fabricacao), 'dd/MM/yyyy') : '',
          amostra.data_vencimento ? format(new Date(amostra.data_vencimento), 'dd/MM/yyyy') : '',
          amostra.cliente || '',
          amostra.observacoes || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `gestao_amostras_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    };
  }, [amostrasFiltradas]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    amostrasFiltradas,
    handleExportCSV
  };
};
