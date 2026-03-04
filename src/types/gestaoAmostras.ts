
export interface Amostra {
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
  tipo_registro?: string;
  tipo_estabilidade_id: string;
  no_projeto_input?: string;
  tipo_controlado?: string;
  produto_controlado?: boolean;
  qtd_controlado?: number;
  un_controlado?: number;
  unidades?: {
    id?: number;
    unidade: string;
  } | null;
  produtos_controlados?: {
    id?: string;
    nome: string;
  } | null;
  
  // Campos de retirada
  total_versoes?: number;
  versoes_retiradas?: number;
  produtos: {
    id?: string;
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
    id?: string;
    nome: string;
    codigo: string;
    tipo: string;
    localizacao?: string;
  } | null;
}

export interface CronogramaItem {
  id: string;
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  data_realizada?: string;
  realizada: boolean;
  quantidade_retirada?: number;
  observacoes?: string;
}

export interface AmostraComCronograma extends Amostra {
  cronograma: CronogramaItem[];
}
