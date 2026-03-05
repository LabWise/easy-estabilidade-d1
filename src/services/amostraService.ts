import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { FormData, TipoEstabilidade } from '@/types/amostra';
import { sanitizeInput, AmostraFormSchema } from '@/lib/security';
import { securityMonitor } from '@/lib/security-monitor';

// Helper function para converter Json para PeriodoRetirada[]
const convertJsonToPeriodos = (json: any) => {
  if (!json || !Array.isArray(json)) return [];
  return json.map((item: any) => ({
    periodo: item.periodo || '',
    dias: item.dias || 0
  }));
};

export const amostraService = {
  async gerarProximoCodigo() {
    try {
      const { data, error } = await supabase.rpc('gerar_proximo_codigo_amostra');
      if (error) {
        console.error('Erro ao gerar código:', error);
        // Fallback: gerar código baseado em timestamp para evitar duplicatas
        const timestamp = Date.now().toString().slice(-6);
        return `EST25${timestamp}`;
      }
      return data;
    } catch (err) {
      console.error('Erro na função de geração de código:', err);
      // Fallback mais robusto
      const timestamp = Date.now().toString().slice(-6);
      return `EST25${timestamp}`;
    }
  },

  async buscarTiposEstabilidade() {
    const { data, error } = await supabase
      .from('tipos_estabilidade')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar tipos de estabilidade:', error);
      return [];
    }
    
    // Converter os dados para o formato correto
    const tiposConvertidos = data?.map(tipo => ({
      ...tipo,
      periodos_retirada: convertJsonToPeriodos(tipo.periodos_retirada)
    })) as TipoEstabilidade[];

    return tiposConvertidos;
  },

  async buscarEquipamentos() {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar equipamentos:', error);
      return [];
    }
    
    return data;
  },

  async criarAmostra(dadosAmostra: any, tiposEstabilidade: TipoEstabilidade[], analisesIds?: string[], formData?: FormData) {
    console.log('Dados para inserção:', dadosAmostra);
    
    // Garantir que o código seja único antes de inserir
    let codigoFinal = dadosAmostra.codigo;
    let tentativas = 0;
    const maxTentativas = 5;
    
    while (tentativas < maxTentativas) {
      // Verificar se o código já existe
      const { data: existingCode } = await supabase
        .from('amostras')
        .select('codigo')
        .eq('codigo', codigoFinal)
        .single();
      
      if (!existingCode) {
        // Código não existe, pode usar
        break;
      }
      
      // Código existe, gerar novo
      console.log(`Código ${codigoFinal} já existe, gerando novo...`);
      const novoCodigo = await this.gerarProximoCodigo();
      codigoFinal = novoCodigo;
      tentativas++;
    }
    
    if (tentativas >= maxTentativas) {
      throw new Error('Não foi possível gerar um código único após várias tentativas');
    }
    
    // Buscar o empresa_id do usuário atual para garantir integridade
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userData?.empresa_id) {
      console.error('Erro ao buscar empresa do usuário:', userError);
      throw new Error('Usuário sem empresa vinculada ou erro ao buscar dados do usuário');
    }

    const empresaId = userData.empresa_id;

    // Atualizar o código nos dados
    dadosAmostra.codigo = codigoFinal;
    
    // Injetar empresa_id explicitamente
    const dadosParaInserir = {
      ...dadosAmostra,
      empresa_id: empresaId
    };
    
    // 1. Inserir a amostra principal
    const { data: amostraData, error: amostraError } = await supabase
      .from('amostras')
      .insert([dadosParaInserir])
      .select();
    
    if (amostraError) {
      console.error('Erro ao inserir amostra:', amostraError);
      throw amostraError;
    }

    const amostra = amostraData[0];
    
    // 1.5. Salvar IFAs da amostra se houver
    const ifasValidos = formData?.ifasLocais?.filter(ifa => ifa.ifa && ifa.fabricante) || [];
    if (ifasValidos.length > 0) {
      console.log('Salvando IFAs válidos:', ifasValidos);
      await this.salvarIFAsAmostra(amostra.id, ifasValidos);
    }
    
    // 2. Se for pós registro e há análises selecionadas, salvar na tabela amostra_analises
    if (dadosAmostra.tipo_registro === 'pos-registro' && analisesIds && analisesIds.length > 0) {
      // Usar empresaId já obtido anteriormente
      
      // Primeiro, gerar o cronograma para obter as subamostras
      const tipoSigla = tiposEstabilidade.find(t => t.id === dadosAmostra.tipo_estabilidade_id)?.sigla;
      
      if (!tipoSigla) {
        throw new Error('Tipo de estabilidade não encontrado');
      }

      // Gerar cronograma principal
      await this.gerarCronogramaAmostra(amostra.id, amostra.codigo, tipoSigla, dadosAmostra.data_entrada);

      // Se for amostra extra, adicionar versão extra
      if (dadosAmostra.amostra_extra) {
        await this.adicionarVersaoExtra(amostra.id, amostra.codigo, tipoSigla, dadosAmostra.data_entrada);
      }

      // Buscar as subamostras criadas no cronograma
      const { data: cronogramaItems } = await supabase
        .from('cronograma_retiradas')
        .select('id')
        .eq('amostra_id', amostra.id);

      // Criar registros de análise para cada combinação análise x subamostra
      const analisesParaInserir = [];
      
      if (cronogramaItems && cronogramaItems.length > 0) {
        // Há subamostras - criar para cada combinação
        for (const cronogramaItem of cronogramaItems) {
          for (const analiseId of analisesIds) {
            analisesParaInserir.push({
              amostra_id: amostra.id,
              tipo_analise_id: analiseId,
              codigo_subamostra_id: cronogramaItem.id,
              empresa_id: empresaId
            });
          }
        }
      } else {
        // Não há subamostras - criar apenas uma por análise (compatibilidade)
        for (const analiseId of analisesIds) {
          analisesParaInserir.push({
            amostra_id: amostra.id,
            tipo_analise_id: analiseId,
            empresa_id: empresaId
          });
        }
      }

      const { error: analisesError } = await supabase
        .from('amostra_analises')
        .insert(analisesParaInserir);

      if (analisesError) {
        console.error('Erro ao salvar análises da amostra:', analisesError);
        throw analisesError;
      }

      // Buscar o cronograma completo gerado para retorno
      const { data: cronogramaData, error: buscarError } = await supabase
        .from('cronograma_retiradas')
        .select('codigo_versao, tempo_coleta, data_programada')
        .eq('amostra_id', amostra.id)
        .order('data_programada');

      if (buscarError) {
        console.error('Erro ao buscar cronograma:', buscarError);
        throw buscarError;
      }

      return { 
        amostra, 
        cronograma: cronogramaData || []
      };
    }
    
    // Para amostras que não são pós-registro, gerar cronograma normalmente
    const tipoSigla = tiposEstabilidade.find(t => t.id === dadosAmostra.tipo_estabilidade_id)?.sigla;
    
    if (!tipoSigla) {
      throw new Error('Tipo de estabilidade não encontrado');
    }

    // Gerar cronograma principal
    await this.gerarCronogramaAmostra(amostra.id, amostra.codigo, tipoSigla, dadosAmostra.data_entrada);

    // Se for amostra extra, adicionar versão extra
    if (dadosAmostra.amostra_extra) {
      await this.adicionarVersaoExtra(amostra.id, amostra.codigo, tipoSigla, dadosAmostra.data_entrada);
    }

    // Buscar o cronograma completo gerado
    const { data: cronogramaData, error: buscarError } = await supabase
      .from('cronograma_retiradas')
      .select('codigo_versao, tempo_coleta, data_programada')
      .eq('amostra_id', amostra.id)
      .order('data_programada');

    if (buscarError) {
      console.error('Erro ao buscar cronograma:', buscarError);
      throw buscarError;
    }

    return { 
      amostra, 
      cronograma: cronogramaData || []
    };
  },

  async gerarCronogramaAmostra(amostraId: string, codigoBase: string, tipoSigla: string, dataEntrada: string) {
    const { error: cronogramaError } = await supabase.rpc('gerar_cronograma_com_versoes', {
      p_amostra_id: amostraId,
      p_codigo_base: codigoBase,
      p_tipo_sigla: tipoSigla,
      p_data_entrada: dataEntrada
    });

    if (cronogramaError) {
      console.error('Erro ao gerar cronograma:', cronogramaError);
      throw cronogramaError;
    }
  },

  async adicionarVersaoExtra(amostraId: string, codigoBase: string, tipoSigla: string, dataEntrada: string) {
    // Buscar todas as versões do cronograma para esta amostra
    const { data: todasVersoes, error: buscarError } = await supabase
      .from('cronograma_retiradas')
      .select('codigo_versao, data_programada')
      .eq('amostra_id', amostraId)
      .order('codigo_versao', { ascending: false });

    if (buscarError) {
      console.error('Erro ao buscar versões:', buscarError);
      throw buscarError;
    }

    if (todasVersoes && todasVersoes.length > 0) {
      // Encontrar o maior número de versão existente
      const numerosVersao = todasVersoes
        .map(versao => {
          const partes = versao.codigo_versao.split('.');
          return parseInt(partes[partes.length - 1] || '0');
        })
        .filter(num => !isNaN(num));
      
      const maiorVersao = Math.max(...numerosVersao);
      const novaVersao = maiorVersao + 1;
      
      // Buscar a data mais recente para calcular data extra
      const { data: ultimaVersao } = await supabase
        .from('cronograma_retiradas')
        .select('data_programada')
        .eq('amostra_id', amostraId)
        .order('data_programada', { ascending: false })
        .limit(1);
      
      const ultimaData = ultimaVersao && ultimaVersao.length > 0 
        ? new Date(ultimaVersao[0].data_programada)
        : new Date(dataEntrada);
      const dataExtra = addDays(ultimaData, 1); // 1 dia após a última data
      
      // Inserir nova versão extra
      const { error: inserirError } = await supabase
        .from('cronograma_retiradas')
        .insert([{
          amostra_id: amostraId,
          codigo_versao: `${codigoBase}.${novaVersao}`,
          tempo_coleta: 'Extra',
          data_programada: format(dataExtra, 'yyyy-MM-dd'),
          realizada: false
        }]);

      if (inserirError) {
        console.error('Erro ao inserir versão extra:', inserirError);
        throw inserirError;
      }
    }
  },

  // Salvar IFAs da amostra (remover existentes e adicionar novos)
  async salvarIFAsAmostra(amostraId: string, ifasLocais: any[]): Promise<void> {
    try {
      // 1. Remover todos os IFAs existentes desta amostra
      const { error: deleteError } = await supabase
        .from('amostra_ifas')
        .delete()
        .eq('amostra_id', amostraId);

      if (deleteError) {
        console.error('Erro ao remover IFAs existentes:', deleteError);
        throw deleteError;
      }

      // 2. Adicionar novos IFAs
      for (const ifaLocal of ifasLocais) {
        // Pular IFAs vazios
        if (!ifaLocal.ifa || !ifaLocal.fabricante) {
          continue;
        }

        // Criar IFA na tabela ifa
        const dadosIFA = {
          ifa: ifaLocal.ifa,
          fabricante: ifaLocal.fabricante,
          dcb: ifaLocal.dcb || '',
          lote: ifaLocal.lote || '',
          data_fabricacao: ifaLocal.data_fabricacao || null,
          data_validade: ifaLocal.data_validade || null,
          endereco_fabricante: ifaLocal.endereco_fabricante || '',
          numero_cas: ifaLocal.numero_cas || ''
        };

        const { data: ifaCriado, error: ifaError } = await supabase
          .from('ifa')
          .insert(dadosIFA)
          .select()
          .single();

        if (ifaError) {
          console.error('Erro ao criar IFA:', ifaError);
          throw ifaError;
        }

        // Relacionar IFA com amostra
        const { error: relError } = await supabase
          .from('amostra_ifas')
          .insert({
            amostra_id: amostraId,
            ifa_id: ifaCriado.id
          });

        if (relError) {
          console.error('Erro ao relacionar IFA com amostra:', relError);
          throw relError;
        }
      }
    } catch (error) {
      console.error('Erro no serviço de salvar IFAs da amostra:', error);
      throw error;
    }
  },

  prepareDadosAmostra(formData: FormData, usuarioNome?: string) {
    // Sanitiza todos os campos de texto antes de enviar para o banco
    const sanitizedData = {
      codigo: formData.codigo,
      tipo_registro: formData.tipoRegistro,
      tipo_estabilidade_id: formData.tipoEstabilidade,
      equipamento_id: formData.equipamentoId || null,
      no_projeto_input: formData.noProjeto ? sanitizeInput(formData.noProjeto, 'Número do Projeto') : null,
      nome_produto: sanitizeInput(formData.nomeProduto, 'Nome do Produto'),
      concentracao_produto: formData.concentracaoProduto ? sanitizeInput(formData.concentracaoProduto, 'Concentração') : null,
      lote: sanitizeInput(formData.lote, 'Lote'),
      tamanho_lote: formData.tamanhoLote ? sanitizeInput(formData.tamanhoLote, 'Tamanho do Lote') : null,
      fabricante: formData.fabricante ? sanitizeInput(formData.fabricante, 'Fabricante') : null,
      endereco_fabricante: formData.enderecoFabricante ? sanitizeInput(formData.enderecoFabricante, 'Endereço do Fabricante') : null,
      material_acondicionamento: formData.materialAcondicionamento ? sanitizeInput(formData.materialAcondicionamento, 'Material de Acondicionamento') : null,
      metodologia_revisao: formData.metodologiaRevisao ? sanitizeInput(formData.metodologiaRevisao, 'Metodologia/Revisão') : null,
      cliente: formData.cliente ? sanitizeInput(formData.cliente, 'Cliente') : null,
      numero_pedido: formData.numeroPedido ? sanitizeInput(formData.numeroPedido, 'Número do Pedido') : null,
      data_pedido: formData.dataPedido ? format(formData.dataPedido, 'yyyy-MM-dd') : null,
      numero_projeto: formData.numeroProjeto ? sanitizeInput(formData.numeroProjeto, 'Número do Projeto') : null,
      numero_proposta: formData.numeroProposta ? sanitizeInput(formData.numeroProposta, 'Número da Proposta') : null,
      motivo_analise: formData.motivoAnalise ? sanitizeInput(formData.motivoAnalise, 'Motivo da Análise') : null,
      data_entrada: formData.dataEntrada,
      data_fabricacao: formData.dataFabricacao ? format(formData.dataFabricacao, 'yyyy-MM-dd') : null,
      data_vencimento: formData.dataVencimento ? format(formData.dataVencimento, 'yyyy-MM-dd') : null,
      amostra_extra: formData.amostraExtra === 'true',
      // Campos Produto Controlado
      produto_controlado: formData.produtoControlado === 'true',
      qtd_controlado: formData.produtoControlado === 'true' && formData.qtdControlado ? parseFloat(formData.qtdControlado) : null,
      un_controlado: formData.produtoControlado === 'true' && formData.unidadeControlado ? formData.unidadeControlado : null,
      tipo_controlado: formData.produtoControlado === 'true' && formData.tipoControlado ? formData.tipoControlado : null,
      usuario_responsavel: usuarioNome ? sanitizeInput(usuarioNome, 'Usuário Responsável') : null,
      status: 'ativo',
      quantidade_inicial: 1,
      quantidade_atual: 1,
      finalizada: false,
      // empresa_id: null // Removido para que o banco use o valor padrão (get_current_user_empresa_id())
    };

    // Remove empresa_id se estiver null/undefined para garantir que o default do banco seja usado
    const { empresa_id, ...dataToInsert } = sanitizedData as any;

    // Valida os dados principais com schema de segurança
    try {
      const validation = AmostraFormSchema.partial().safeParse(sanitizedData);
      if (!validation.success) {
        securityMonitor.logSecurityEvent(
          'warning',
          'Amostra data validation failed',
          { errors: validation.error.errors }
        );
      }
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'error',
        'Error validating amostra data',
        { error }
      );
    }

    return dataToInsert;
  }
};

// Exportar função específica para uso em componentes
export const { salvarIFAsAmostra } = amostraService;
