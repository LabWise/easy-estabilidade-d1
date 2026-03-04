
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormData } from '@/types/amostra';

// Função para obter data atual no formato correto (UTC)
const getDataAtualBrasil = () => {
  const agora = new Date();
  return format(agora, 'yyyy-MM-dd');
};

export const useFormData = (proximoCodigo?: string) => {
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    dataEntrada: getDataAtualBrasil(),
    tipoRegistro: 'pre-registro',
    tipoEstabilidade: '',
    amostraExtra: 'false',
    produtoControlado: 'false',
    qtdControlado: '',
    unidadeControlado: '',
    tipoControlado: '',
    noProjeto: '',
    nomeProduto: '',
    concentracaoProduto: '',
    lote: '',
    tamanhoLote: '',
    fabricante: '',
    enderecoFabricante: '',
    equipamentoId: '',
    materialAcondicionamento: '',
    metodologiaRevisao: '',
    cliente: '',
    numeroPedido: '',
    dataPedido: null,
    numeroProjeto: '',
    numeroProposta: '',
    motivoAnalise: '',
    dataFabricacao: null,
    dataVencimento: null,
    // IFAs locais - inicializar com primeiro IFA
    ifasLocais: [{
      id: `temp-${Date.now()}-initial`,
      ifa: '',
      fabricante: '',
      dcb: '',
      lote: '',
      data_fabricacao: null,
      data_validade: null,
      endereco_fabricante: '',
      numero_cas: '',
    }],
    analisesIds: []
  });

  // Atualizar código quando disponível
  useEffect(() => {
    if (proximoCodigo && !formData.codigo) {
      setFormData(prev => ({ ...prev, codigo: proximoCodigo }));
    }
  }, [proximoCodigo, formData.codigo]);

  // Atualizar número do projeto (sistema) automaticamente baseado no código da amostra
  useEffect(() => {
    if (formData.codigo) {
      const numeroProjeto = formData.codigo.replace(/^EST/, 'PROJ');
      setFormData(prev => ({ ...prev, numeroProjeto }));
    }
  }, [formData.codigo]);

  const handleReset = () => {
    setFormData({
      codigo: proximoCodigo || '',
      dataEntrada: getDataAtualBrasil(),
      tipoRegistro: 'pre-registro',
      tipoEstabilidade: '',
      amostraExtra: 'false',
      produtoControlado: 'false',
      qtdControlado: '',
      unidadeControlado: '',
      tipoControlado: '',
      noProjeto: '',
      nomeProduto: '',
      concentracaoProduto: '',
      lote: '',
      tamanhoLote: '',
      fabricante: '',
      enderecoFabricante: '',
      equipamentoId: '',
      materialAcondicionamento: '',
      metodologiaRevisao: '',
      cliente: '',
      numeroPedido: '',
      dataPedido: null,
      numeroProjeto: '',
      numeroProposta: '',
      motivoAnalise: '',
      dataFabricacao: null,
      dataVencimento: null,
      // IFAs locais - inicializar com primeiro IFA
      ifasLocais: [{
        id: `temp-${Date.now()}-initial`,
        ifa: '',
        fabricante: '',
        dcb: '',
        lote: '',
        data_fabricacao: null,
        data_validade: null,
        endereco_fabricante: '',
        numero_cas: '',
      }],
      analisesIds: []
    });

    // Força a atualização dos componentes seguros após o reset
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('formReset'));
    }, 0);
  };

  return {
    formData,
    setFormData,
    handleReset
  };
};
