import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusRetiradaConfig {
  id: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

export interface AmostraRetirada {
  id: string;
  amostra_id: string;
  codigo_amostra: string;
  usuario_retirada: string;
  data_retirada: string;
  status_textual: string;
  metodo_identificacao: string;
  observacoes?: string;
}

export interface DadosRetirada {
  codigoAmostra: string;
  statusTextual: string;
  metodoIdentificacao: 'manual' | 'qrcode' | 'lote';
  observacoes?: string;
  usuario: string;
  justificativa?: string;
  quantidadeRetirada?: number;
}

export interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
  amostra?: any;
  versoes?: any[];
  tipo?: 'versao' | 'codigo_base';
}

export interface ResultadoRetirada {
  sucesso: boolean;
  erro?: string;
  mensagem?: string;
  retirada_id?: string;
}

export interface ProdutoControladoData {
  qtd_controlado: number;
  un_controlado: number;
  tipo_controlado: string;
  unidade: string;
  produto_nome: string;
}

export const useRetiradaAmostra = () => {
  const queryClient = useQueryClient();
  const [amostraEncontrada, setAmostraEncontrada] = useState<any>(null);
  const [versoesDisponiveis, setVersoesDisponiveis] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Buscar configurações de status
  const { data: statusConfiguracoes = [], isLoading: isLoadingStatus } = useQuery({
    queryKey: ['status-retirada-configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_retirada_configuracoes')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) {
        console.error('Erro ao buscar configurações de status:', error);
        throw error;
      }

      return data as StatusRetiradaConfig[];
    }
  });

  // Buscar última retirada (filtrada por empresa)
  const { data: ultimaRetirada } = useQuery({
    queryKey: ['ultima-retirada'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiradas_amostras')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar última retirada:', error);
        throw error;
      }

      return data?.[0] || null;
    }
  });

  // Função para validar se é próxima versão na sequência
  const validarSequenciaVersao = async (amostraId: string, numeroVersao: number) => {
    // Buscar todas as retiradas desta amostra (filtrada por empresa)
    const { data: retiradas } = await supabase
      .from('retiradas_amostras')
      .select('codigo_amostra')
      .eq('amostra_id', amostraId)
      .order('created_at');

    // Buscar cronogramas para verificar quais são extras (filtrada por empresa)
    const { data: cronogramas } = await supabase
      .from('cronograma_retiradas')
      .select('codigo_versao, tempo_coleta')
      .eq('amostra_id', amostraId);

    const cronogramaMap = new Map(
      cronogramas?.map(c => [c.codigo_versao, c.tempo_coleta.toLowerCase()]) || []
    );

    // Filtrar apenas versões normais (não extras) para validação sequencial
    const versoesRetiradas = retiradas
      ?.filter(r => {
        const tempoColeta = cronogramaMap.get(r.codigo_amostra);
        return tempoColeta !== 'extra';
      })
      .map(r => {
        const partes = r.codigo_amostra.split('.');
        return parseInt(partes[1]);
      }).sort((a, b) => a - b) || [];

    const ultimaVersaoRetirada = versoesRetiradas.length > 0 ? 
      Math.max(...versoesRetiradas) : 0;

    return numeroVersao === ultimaVersaoRetirada + 1;
  };

  // Função para normalizar código de entrada
  const normalizarCodigo = (codigo: string): string => {
    const codigoLimpo = codigo.trim();
    
    // Se contém apenas números, adicionar prefixo EST
    if (/^\d+$/.test(codigoLimpo)) {
      console.log('📝 Código apenas numérico, adicionando prefixo EST');
      return `EST${codigoLimpo}`;
    }
    
    // Se contém números e ponto (versão apenas numérica), adicionar prefixo EST
    if (/^\d+\.\d+$/.test(codigoLimpo)) {
      console.log('📝 Versão apenas numérica, adicionando prefixo EST');
      return `EST${codigoLimpo}`;
    }
    
    // Converter para maiúsculo para padronizar
    return codigoLimpo.toUpperCase();
  };

  // Validar código de versão ou buscar versões por código base
  const validarCodigo = async (codigo: string): Promise<ResultadoValidacao> => {
    console.log('🔍 Iniciando validação do código:', codigo);
    setIsValidating(true);
    
    try {
      // Normalizar o código de entrada
      const codigoNormalizado = normalizarCodigo(codigo);
      console.log('🔧 Código normalizado:', codigoNormalizado);
      
      // Verificar se é um código de versão (contém ponto)
      const temPonto = codigoNormalizado.includes('.');
      
      if (temPonto) {
        // É um código de versão específica
        return await validarCodigoVersao(codigoNormalizado);
      } else {
        // É um código base, buscar todas as versões
        return await buscarVersoesPorCodigoBase(codigoNormalizado);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      return { valido: false, erro: 'Erro interno na validação' };
    } finally {
      setIsValidating(false);
    }
  };

  // Validar código de versão específica
  const validarCodigoVersao = async (codigoVersao: string): Promise<ResultadoValidacao> => {
    console.log('🔍 Validando código da versão:', codigoVersao);
    
    const { data: cronogramaDados, error: cronogramaError } = await supabase
      .from('cronograma_retiradas')
      .select(`
        *,
        amostras(
          *,
          produtos(nome, fabricante),
          tipos_estabilidade(nome, sigla),
          equipamentos(nome)
        )
      `)
      .eq('codigo_versao', codigoVersao)
      .maybeSingle();

    console.log('📊 Resultado da query:', { cronogramaDados, cronogramaError });

    if (cronogramaError) {
      console.error('💥 Erro ao validar código de versão:', cronogramaError);
      return { valido: false, erro: 'Erro ao buscar versão no banco de dados' };
    }

    if (!cronogramaDados) {
      console.log('❌ Código de versão não encontrado:', codigoVersao);
      return { valido: false, erro: 'Código de versão não encontrado: ' + codigoVersao };
    }

    const amostra = cronogramaDados.amostras;
    console.log('✅ Dados da amostra encontrada:', amostra);
    
    if (amostra && amostra.status && ['cancelado', 'finalizado', 'retirada'].includes(amostra.status)) {
      console.log('⚠️ Status da amostra impede retirada:', amostra.status);
      return { 
        valido: false, 
        erro: `Amostra não pode ser retirada devido ao status atual: ${amostra.status}` 
      };
    }

    // Verificar se a versão já foi retirada (filtrada por empresa)
    const { data: retiradaExistente } = await supabase
      .from('retiradas_amostras')
      .select('id, data_retirada, usuario_retirada')
      .eq('codigo_amostra', codigoVersao)
      .maybeSingle();

    console.log('🔍 Verificando retirada existente:', retiradaExistente);

    if (retiradaExistente) {
      console.log('⚠️ Versão já foi retirada:', retiradaExistente);
      // Buscar a próxima versão na sequência para sugerir
      const codigoBase = codigoVersao.split('.')[0];
      const numeroVersao = parseInt(codigoVersao.split('.')[1]);
      const proximaVersao = `${codigoBase}.${numeroVersao + 1}`;
      
      const { data: proximoChronograma } = await supabase
        .from('cronograma_retiradas')
        .select('codigo_versao')
        .eq('codigo_versao', proximaVersao)
        .maybeSingle();

      const sugestao = proximoChronograma ? 
        `\n\nTente buscar pela próxima versão: ${proximaVersao}` : 
        `\n\nBusque pelo código base ${codigoBase} para ver todas as versões disponíveis.`;

      return { 
        valido: false, 
        erro: `Esta versão já foi retirada em ${new Date(retiradaExistente.data_retirada).toLocaleDateString('pt-BR')} por ${retiradaExistente.usuario_retirada}.${sugestao}` 
      };
    }

    if (cronogramaDados.realizada) {
      console.log('⚠️ Cronograma marcado como realizado');
      const codigoBase = codigoVersao.split('.')[0];
      return { 
        valido: false, 
        erro: `Esta versão já foi marcada como realizada.\n\nBusque pelo código base ${codigoBase} para ver todas as versões disponíveis.` 
      };
    }

    // Verificar se é versão extra para permitir retirada fora de sequência
    const isVersaoExtra = cronogramaDados.tempo_coleta.toLowerCase() === 'extra';
    console.log('🎯 Versão extra:', isVersaoExtra);
    
    if (!isVersaoExtra) {
      // Validar sequência apenas para amostras não-extras
      console.log('🔄 Validando sequência para amostra normal...');
      const numeroVersao = parseInt(codigoVersao.split('.')[1]);
      const sequenciaValida = await validarSequenciaVersao(amostra.id, numeroVersao);
      console.log('📋 Sequência válida:', sequenciaValida);
      
      if (!sequenciaValida) {
        console.log('⚠️ Sequência inválida para versão:', numeroVersao);
        const codigoBase = codigoVersao.split('.')[0];
        return { 
          valido: false, 
          erro: `Esta versão não pode ser retirada ainda. Deve seguir a sequência de retiradas.\n\nBusque pelo código base ${codigoBase} para ver a ordem correta.` 
        };
      }
    } else {
      console.log('✅ Amostra extra - sequência não obrigatória');
    }

    const dadosCombinados = {
      ...amostra,
      codigo_versao: cronogramaDados.codigo_versao,
      tempo_coleta: cronogramaDados.tempo_coleta,
      data_programada: cronogramaDados.data_programada,
      cronograma_id: cronogramaDados.id
    };

    console.log('🎯 Versão válida encontrada! Definindo amostra:', dadosCombinados);
    setAmostraEncontrada(dadosCombinados);
    setVersoesDisponiveis([]);
    
    console.log('✅ Estado atualizado - amostraEncontrada definida');
    return { valido: true, amostra: dadosCombinados, tipo: 'versao' };
  };

  // Buscar versões por código base
  const buscarVersoesPorCodigoBase = async (codigoBase: string): Promise<ResultadoValidacao> => {
    // Buscar amostra pelo código base (filtrada por empresa)
    const { data: amostra, error: amostraError } = await supabase
      .from('amostras')
      .select(`
        *,
        produtos(nome, fabricante),
        tipos_estabilidade(nome, sigla),
        equipamentos(nome)
      `)
      .eq('codigo', codigoBase)
      .maybeSingle();

    if (amostraError || !amostra) {
      return { valido: false, erro: 'Código de amostra não encontrado: ' + codigoBase };
    }

    if (amostra.status && ['cancelado', 'finalizado', 'retirada'].includes(amostra.status)) {
      return { 
        valido: false, 
        erro: `Amostra não pode ser retirada devido ao status atual: ${amostra.status}` 
      };
    }

    // Buscar todas as versões desta amostra (filtrada por empresa)
    const { data: cronogramas, error: cronogramaError } = await supabase
      .from('cronograma_retiradas')
      .select('*')
      .eq('amostra_id', amostra.id)
      .order('codigo_versao');

    if (cronogramaError) {
      return { valido: false, erro: 'Erro ao buscar versões da amostra' };
    }

    if (!cronogramas || cronogramas.length === 0) {
      return { valido: false, erro: 'Nenhuma versão encontrada para esta amostra' };
    }

    // Verificar quais versões já foram retiradas (filtrada por empresa)
    const { data: retiradas } = await supabase
      .from('retiradas_amostras')
      .select('codigo_amostra')
      .eq('amostra_id', amostra.id);

    const codigosRetirados = new Set(retiradas?.map(r => r.codigo_amostra) || []);

    // Preparar lista de versões com status de sequência
    const versoesComStatus = await Promise.all(
      cronogramas.map(async (cronograma) => {
        const numeroVersao = parseInt(cronograma.codigo_versao.split('.')[1]);
        const jaRetirada = codigosRetirados.has(cronograma.codigo_versao);
        
        // Verificar se é versão extra para permitir retirada a qualquer momento
        const isVersaoExtra = cronograma.tempo_coleta.toLowerCase() === 'extra';
        
        let sequenciaValida = false;
        if (isVersaoExtra) {
          // Versões extras sempre têm sequência válida
          sequenciaValida = true;
          console.log('✅ Versão extra sempre disponível:', cronograma.codigo_versao);
        } else {
          // Validar sequência apenas para amostras normais
          sequenciaValida = await validarSequenciaVersao(amostra.id, numeroVersao);
        }
        
        return {
          ...cronograma,
          realizada: jaRetirada,
          sequencia_valida: sequenciaValida || jaRetirada
        };
      })
    );

    setAmostraEncontrada(amostra);
    setVersoesDisponiveis(versoesComStatus);
    
    return { 
      valido: true, 
      amostra: amostra, 
      versoes: versoesComStatus,
      tipo: 'codigo_base' 
    };
  };

  // Buscar dados de produto controlado (se aplicável)
  const buscarProdutoControlado = async (amostraId: string): Promise<ProdutoControladoData | null> => {
    try {
      const { data, error } = await supabase
        .from('amostras')
        .select(`
          qtd_controlado,
          un_controlado,
          tipo_controlado,
          produto_controlado,
          produtos(nome)
        `)
        .eq('id', amostraId)
        .eq('produto_controlado', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Casting para any para evitar erros de tipagem do Supabase quando a relação não é encontrada nos tipos
      const dados = data as any;

      return {
        qtd_controlado: dados.qtd_controlado || 0,
        un_controlado: dados.un_controlado || 0,
        tipo_controlado: dados.tipo_controlado || '',
        unidade: dados.un_controlado?.toString() || '',
        produto_nome: dados.produtos?.nome || ''
      };
    } catch (error) {
      console.error('Erro ao buscar dados de produto controlado:', error);
      return null;
    }
  };

  // Função para verificar se a retirada precisa de justificativa
  const verificarNecessidadeJustificativa = (dataProgramada: string): { 
    necessita: boolean; 
    tipo: 'antecipada' | 'atrasada' | null;
    dataAtual: string;
  } => {
    const hoje = new Date();
    const dataProgram = new Date(dataProgramada);
    const dataAtualStr = hoje.toISOString().split('T')[0];
    
    // Normalizar datas para comparação (apenas data, sem hora)
    hoje.setHours(0, 0, 0, 0);
    dataProgram.setHours(0, 0, 0, 0);
    
    // Verificar se é antecipada (antes da data programada)
    if (hoje < dataProgram) {
      return { 
        necessita: true, 
        tipo: 'antecipada',
        dataAtual: dataAtualStr
      };
    }
    
    // Verificar se é atrasada (mais de 5 dias após a data programada)
    const diffTime = hoje.getTime() - dataProgram.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 5) {
      return { 
        necessita: true, 
        tipo: 'atrasada',
        dataAtual: dataAtualStr
      };
    }
    
    return { 
      necessita: false, 
      tipo: null,
      dataAtual: dataAtualStr
    };
  };

  // Processar retirada
  const processarRetiradaMutation = useMutation({
    mutationFn: async (dados: DadosRetirada): Promise<ResultadoRetirada> => {
      console.log('Processando retirada:', dados);

      // Combinar observações com justificativa se fornecida
      const observacoesCompletas = dados.justificativa 
        ? `${dados.observacoes || ''} | Justificativa: ${dados.justificativa}`.trim()
        : dados.observacoes;

      const { data, error } = await supabase.rpc('validar_retirada_amostra', {
        p_codigo_versao: dados.codigoAmostra,
        p_usuario: dados.usuario,
        p_status_textual: dados.statusTextual,
        p_metodo: dados.metodoIdentificacao,
        p_observacoes: observacoesCompletas || null,
        p_ip_address: null, // TODO: Capturar IP real
        p_user_agent: navigator.userAgent,
        p_quantidade_retirada: dados.quantidadeRetirada || null
      });

      if (error) {
        console.error('Erro na função de retirada:', error);
        return { sucesso: false, erro: 'Erro interno ao processar retirada' };
      }

      const resultado = data as any;
      
      if (!resultado.sucesso) {
        return { 
          sucesso: false, 
          erro: resultado.erro || 'Erro desconhecido na retirada' 
        };
      }

      return {
        sucesso: true,
        mensagem: resultado.mensagem,
        retirada_id: resultado.retirada_id
      };
    },
    onSuccess: (resultado) => {
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['ultima-retirada'] });
      queryClient.invalidateQueries({ queryKey: ['amostras'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-amostras'] });
      
      // Atualizar a lista de versões se disponível
      if (amostraEncontrada && versoesDisponiveis.length > 0) {
        // Re-buscar as versões atualizadas
        const codigoBase = amostraEncontrada.codigo;
        buscarVersoesPorCodigoBase(codigoBase);
      } else {
        // Limpar amostra encontrada apenas se não há versões para mostrar
        setAmostraEncontrada(null);
        setVersoesDisponiveis([]);
      }
    }
  });

  return {
    statusConfiguracoes,
    isLoadingStatus,
    ultimaRetirada,
    amostraEncontrada,
    versoesDisponiveis,
    isValidating,
    validarCodigo,
    processarRetirada: processarRetiradaMutation.mutateAsync,
    isProcessing: processarRetiradaMutation.isPending,
    processarRetiradaResult: processarRetiradaMutation,
    verificarNecessidadeJustificativa,
    buscarProdutoControlado
  };
};
