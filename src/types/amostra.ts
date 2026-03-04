
export interface PeriodoRetirada {
  periodo: string;
  dias: number;
}

export interface TipoEstabilidade {
  id: string;
  nome: string;
  sigla: string;
  periodos_retirada?: PeriodoRetirada[];
}

export interface Equipamento {
  id: string;
  nome: string;
  codigo: string;
}

export interface IFALocal {
  id: string; // ID temporário para controle local
  ifa: string;
  fabricante: string;
  dcb: string;
  lote: string;
  data_fabricacao: Date | null;
  data_validade: Date | null;
  endereco_fabricante: string;
  numero_cas: string;
}

export interface FormData {
  codigo: string;
  dataEntrada: string;
  tipoRegistro: 'pre-registro' | 'pos-registro';
  tipoEstabilidade: string;
  amostraExtra: string;
  produtoControlado: string;
  qtdControlado: string;
  unidadeControlado: string;
  tipoControlado: string;
  noProjeto: string;
  nomeProduto: string;
  concentracaoProduto: string;
  lote: string;
  tamanhoLote: string;
  fabricante: string;
  enderecoFabricante: string;
  equipamentoId: string;
  materialAcondicionamento: string;
  metodologiaRevisao: string;
  cliente: string;
  numeroPedido: string;
  dataPedido: Date | null;
  numeroProjeto: string;
  numeroProposta: string;
  motivoAnalise: string;
  dataFabricacao: Date | null;
  dataVencimento: Date | null;
  // IFAs locais (não salvos ainda)
  ifasLocais: IFALocal[];
  analisesIds?: string[];
}

export interface CronogramaItem {
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
}

export interface AmostraDetalhada {
  id: string;
  codigo: string;
  lote: string;
  data_entrada: string;
  data_fabricacao?: string;
  data_vencimento?: string;
  status: string;
  amostra_extra: boolean;
  quantidade_inicial: number;
  quantidade_atual: number;
  temperatura?: number;
  umidade?: number;
  observacoes?: string;
  usuario_responsavel?: string;
  nome_produto?: string;
  fabricante?: string;
  cliente?: string;
  numero_pedido?: string;
  numero_projeto?: string;
  numero_proposta?: string;
  data_pedido?: string;
  motivo_analise?: string;
  tipo_estabilidade_id: string;
  produtos: {
    nome: string;
    fabricante: string | null;
    codigo: string;
    principio_ativo?: string;
    concentracao?: string;
    forma_farmaceutica?: string;
  } | null;
  tipos_estabilidade: {
    nome: string;
    sigla: string;
    descricao?: string;
  } | null;
  equipamentos: {
    nome: string;
    codigo: string;
    tipo: string;
    localizacao?: string;
  } | null;
}
