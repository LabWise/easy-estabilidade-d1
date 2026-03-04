export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amostra_analises: {
        Row: {
          amostra_id: string
          codigo_subamostra_id: string | null
          created_at: string
          empresa_id: number | null
          id: string
          tipo_analise_id: string
          updated_at: string
        }
        Insert: {
          amostra_id: string
          codigo_subamostra_id?: string | null
          created_at?: string
          empresa_id?: number | null
          id?: string
          tipo_analise_id: string
          updated_at?: string
        }
        Update: {
          amostra_id?: string
          codigo_subamostra_id?: string | null
          created_at?: string
          empresa_id?: number | null
          id?: string
          tipo_analise_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amostra_analises_amostra_id_fkey"
            columns: ["amostra_id"]
            isOneToOne: false
            referencedRelation: "amostras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostra_analises_codigo_subamostra_id_fkey"
            columns: ["codigo_subamostra_id"]
            isOneToOne: false
            referencedRelation: "cronograma_retiradas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostra_analises_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostra_analises_tipo_analise_id_fkey"
            columns: ["tipo_analise_id"]
            isOneToOne: false
            referencedRelation: "tipos_analise"
            referencedColumns: ["id"]
          },
        ]
      }
      amostra_ifas: {
        Row: {
          amostra_id: string
          created_at: string
          empresa_id: number
          id: string
          ifa_id: number
          updated_at: string
        }
        Insert: {
          amostra_id: string
          created_at?: string
          empresa_id?: number
          id?: string
          ifa_id: number
          updated_at?: string
        }
        Update: {
          amostra_id?: string
          created_at?: string
          empresa_id?: number
          id?: string
          ifa_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_amostra_ifas_ifa"
            columns: ["ifa_id"]
            isOneToOne: false
            referencedRelation: "ifa"
            referencedColumns: ["id"]
          },
        ]
      }
      amostras: {
        Row: {
          amostra_extra: boolean | null
          cliente: string | null
          codigo: string
          concentracao_produto: string | null
          created_at: string
          data_entrada: string
          data_fabricacao: string | null
          data_pedido: string | null
          data_vencimento: string | null
          empresa_id: number
          endereco_fabricante: string | null
          equipamento_id: string | null
          fabricante: string | null
          finalizada: boolean | null
          id: string
          lote: string
          material_acondicionamento: string | null
          metodologia_revisao: string | null
          motivo_analise: string | null
          no_projeto_input: string | null
          nome_produto: string | null
          numero_pedido: string | null
          numero_projeto: string | null
          numero_proposta: string | null
          observacoes: string | null
          produto_controlado: boolean
          qtd_controlado: number | null
          quantidade_atual: number
          quantidade_inicial: number
          status: string | null
          tamanho_lote: string | null
          temperatura: number | null
          termino_estudo: string | null
          tipo_controlado: string | null
          tipo_estabilidade_id: string
          tipo_registro: string | null
          umidade: number | null
          un_controlado: number | null
          updated_at: string
          usuario_responsavel: string | null
        }
        Insert: {
          amostra_extra?: boolean | null
          cliente?: string | null
          codigo: string
          concentracao_produto?: string | null
          created_at?: string
          data_entrada?: string
          data_fabricacao?: string | null
          data_pedido?: string | null
          data_vencimento?: string | null
          empresa_id?: number
          endereco_fabricante?: string | null
          equipamento_id?: string | null
          fabricante?: string | null
          finalizada?: boolean | null
          id?: string
          lote: string
          material_acondicionamento?: string | null
          metodologia_revisao?: string | null
          motivo_analise?: string | null
          no_projeto_input?: string | null
          nome_produto?: string | null
          numero_pedido?: string | null
          numero_projeto?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          produto_controlado?: boolean
          qtd_controlado?: number | null
          quantidade_atual: number
          quantidade_inicial: number
          status?: string | null
          tamanho_lote?: string | null
          temperatura?: number | null
          termino_estudo?: string | null
          tipo_controlado?: string | null
          tipo_estabilidade_id: string
          tipo_registro?: string | null
          umidade?: number | null
          un_controlado?: number | null
          updated_at?: string
          usuario_responsavel?: string | null
        }
        Update: {
          amostra_extra?: boolean | null
          cliente?: string | null
          codigo?: string
          concentracao_produto?: string | null
          created_at?: string
          data_entrada?: string
          data_fabricacao?: string | null
          data_pedido?: string | null
          data_vencimento?: string | null
          empresa_id?: number
          endereco_fabricante?: string | null
          equipamento_id?: string | null
          fabricante?: string | null
          finalizada?: boolean | null
          id?: string
          lote?: string
          material_acondicionamento?: string | null
          metodologia_revisao?: string | null
          motivo_analise?: string | null
          no_projeto_input?: string | null
          nome_produto?: string | null
          numero_pedido?: string | null
          numero_projeto?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          produto_controlado?: boolean
          qtd_controlado?: number | null
          quantidade_atual?: number
          quantidade_inicial?: number
          status?: string | null
          tamanho_lote?: string | null
          temperatura?: number | null
          termino_estudo?: string | null
          tipo_controlado?: string | null
          tipo_estabilidade_id?: string
          tipo_registro?: string | null
          umidade?: number | null
          un_controlado?: number | null
          updated_at?: string
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amostras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostras_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostras_tipo_controlado_fkey"
            columns: ["tipo_controlado"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostras_tipo_estabilidade_id_fkey"
            columns: ["tipo_estabilidade_id"]
            isOneToOne: false
            referencedRelation: "tipos_estabilidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amostras_un_controlado_fkey"
            columns: ["un_controlado"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_analise: {
        Row: {
          created_at: string
          dias_analise: number
          empresa_id: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_analise?: number
          empresa_id?: number
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_analise?: number
          empresa_id?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_analise_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_retiradas: {
        Row: {
          amostra_id: string
          codigo_versao: string | null
          created_at: string
          data_programada: string
          data_realizada: string | null
          empresa_id: number
          id: string
          observacoes: string | null
          quantidade_retirada: number | null
          realizada: boolean | null
          tempo_coleta: string
          updated_at: string
          usuario_retirada: string | null
        }
        Insert: {
          amostra_id: string
          codigo_versao?: string | null
          created_at?: string
          data_programada: string
          data_realizada?: string | null
          empresa_id?: number
          id?: string
          observacoes?: string | null
          quantidade_retirada?: number | null
          realizada?: boolean | null
          tempo_coleta: string
          updated_at?: string
          usuario_retirada?: string | null
        }
        Update: {
          amostra_id?: string
          codigo_versao?: string | null
          created_at?: string
          data_programada?: string
          data_realizada?: string | null
          empresa_id?: number
          id?: string
          observacoes?: string | null
          quantidade_retirada?: number | null
          realizada?: boolean | null
          tempo_coleta?: string
          updated_at?: string
          usuario_retirada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_retiradas_amostra_id_fkey"
            columns: ["amostra_id"]
            isOneToOne: false
            referencedRelation: "amostras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_retiradas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          id: number
          nome: string
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nome: string
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          ativo: boolean | null
          capacidade: number | null
          codigo: string
          created_at: string
          empresa_id: number
          id: string
          localizacao: string | null
          nome: string
          temperatura_max: number | null
          temperatura_min: number | null
          tipo: string
          umidade_max: number | null
          umidade_min: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade?: number | null
          codigo: string
          created_at?: string
          empresa_id?: number
          id?: string
          localizacao?: string | null
          nome: string
          temperatura_max?: number | null
          temperatura_min?: number | null
          tipo: string
          umidade_max?: number | null
          umidade_min?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          capacidade?: number | null
          codigo?: string
          created_at?: string
          empresa_id?: number
          id?: string
          localizacao?: string | null
          nome?: string
          temperatura_max?: number | null
          temperatura_min?: number | null
          tipo?: string
          umidade_max?: number | null
          umidade_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_alteracao_analises: {
        Row: {
          amostra_id: string
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          data_alteracao: string
          empresa_id: number
          id: string
          justificativa: string
          tipo_alteracao: string
          updated_at: string
          usuario_alteracao: string
        }
        Insert: {
          amostra_id: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          data_alteracao?: string
          empresa_id?: number
          id?: string
          justificativa: string
          tipo_alteracao: string
          updated_at?: string
          usuario_alteracao: string
        }
        Update: {
          amostra_id?: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          data_alteracao?: string
          empresa_id?: number
          id?: string
          justificativa?: string
          tipo_alteracao?: string
          updated_at?: string
          usuario_alteracao?: string
        }
        Relationships: []
      }
      historico_status_amostras: {
        Row: {
          amostra_id: string
          created_at: string
          data_alteracao: string
          empresa_id: number
          id: string
          justificativa: string
          status_anterior: string | null
          status_novo: string
          usuario_alteracao: string
        }
        Insert: {
          amostra_id: string
          created_at?: string
          data_alteracao?: string
          empresa_id?: number
          id?: string
          justificativa: string
          status_anterior?: string | null
          status_novo: string
          usuario_alteracao: string
        }
        Update: {
          amostra_id?: string
          created_at?: string
          data_alteracao?: string
          empresa_id?: number
          id?: string
          justificativa?: string
          status_anterior?: string | null
          status_novo?: string
          usuario_alteracao?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_historico_amostra"
            columns: ["amostra_id"]
            isOneToOne: false
            referencedRelation: "amostras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_status_amostras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ifa: {
        Row: {
          created_at: string
          data_fabricacao: string | null
          data_validade: string | null
          dcb: string | null
          empresa_id: number
          endereco_fabricante: string | null
          fabricante: string | null
          id: number
          ifa: string | null
          lote: string | null
          numero_cas: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          dcb?: string | null
          empresa_id?: number
          endereco_fabricante?: string | null
          fabricante?: string | null
          id?: number
          ifa?: string | null
          lote?: string | null
          numero_cas?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          dcb?: string | null
          empresa_id?: number
          endereco_fabricante?: string | null
          fabricante?: string | null
          id?: number
          ifa?: string | null
          lote?: string | null
          numero_cas?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string | null
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          empresa_id: number | null
          id: string
          ip: string | null
          registro_id: string | null
          tabela: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          acao?: string | null
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          empresa_id?: number | null
          id?: string
          ip?: string | null
          registro_id?: string | null
          tabela?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string | null
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          empresa_id?: number | null
          id?: string
          ip?: string | null
          registro_id?: string | null
          tabela?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          codigo: string
          concentracao: string | null
          created_at: string
          empresa_id: number
          fabricante: string | null
          forma_farmaceutica: string | null
          id: string
          nome: string
          principio_ativo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: number
          fabricante?: string | null
          forma_farmaceutica?: string | null
          id?: string
          nome: string
          principio_ativo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: number
          fabricante?: string | null
          forma_farmaceutica?: string | null
          id?: string
          nome?: string
          principio_ativo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      retiradas_amostras: {
        Row: {
          amostra_id: string
          codigo_amostra: string
          created_at: string
          data_retirada: string
          empresa_id: number
          id: string
          ip_address: unknown | null
          metodo_identificacao: string
          observacoes: string | null
          quantidade_retirada: number | null
          status_textual: string
          updated_at: string
          user_agent: string | null
          usuario_retirada: string
        }
        Insert: {
          amostra_id: string
          codigo_amostra: string
          created_at?: string
          data_retirada?: string
          empresa_id?: number
          id?: string
          ip_address?: unknown | null
          metodo_identificacao: string
          observacoes?: string | null
          quantidade_retirada?: number | null
          status_textual: string
          updated_at?: string
          user_agent?: string | null
          usuario_retirada: string
        }
        Update: {
          amostra_id?: string
          codigo_amostra?: string
          created_at?: string
          data_retirada?: string
          empresa_id?: number
          id?: string
          ip_address?: unknown | null
          metodo_identificacao?: string
          observacoes?: string | null
          quantidade_retirada?: number | null
          status_textual?: string
          updated_at?: string
          user_agent?: string | null
          usuario_retirada?: string
        }
        Relationships: [
          {
            foreignKeyName: "retiradas_amostras_amostra_id_fkey"
            columns: ["amostra_id"]
            isOneToOne: false
            referencedRelation: "amostras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiradas_amostras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      status_analises_amostras: {
        Row: {
          amostra_analise_id: string
          amostra_id: string
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          empresa_id: number
          id: string
          observacoes: string | null
          resultados: string | null
          status: string
          tipo_analise_id: string
          updated_at: string
          usuario_analista: string | null
          usuario_conclusao: string | null
        }
        Insert: {
          amostra_analise_id: string
          amostra_id: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          empresa_id?: number
          id?: string
          observacoes?: string | null
          resultados?: string | null
          status?: string
          tipo_analise_id: string
          updated_at?: string
          usuario_analista?: string | null
          usuario_conclusao?: string | null
        }
        Update: {
          amostra_analise_id?: string
          amostra_id?: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          empresa_id?: number
          id?: string
          observacoes?: string | null
          resultados?: string | null
          status?: string
          tipo_analise_id?: string
          updated_at?: string
          usuario_analista?: string | null
          usuario_conclusao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_status_analises_amostra"
            columns: ["amostra_id"]
            isOneToOne: false
            referencedRelation: "amostras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_status_analises_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_status_analises_tipo"
            columns: ["tipo_analise_id"]
            isOneToOne: false
            referencedRelation: "tipos_analise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_analises_amostras_amostra_analise_id_fkey"
            columns: ["amostra_analise_id"]
            isOneToOne: true
            referencedRelation: "amostra_analises"
            referencedColumns: ["id"]
          },
        ]
      }
      status_retirada_configuracoes: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          empresa_id: number
          id: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao: string
          empresa_id?: number
          id?: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          empresa_id?: number
          id?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_retirada_configuracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_analise: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          detalhamento: string | null
          empresa_id: number | null
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao: string
          detalhamento?: string | null
          empresa_id?: number | null
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          detalhamento?: string | null
          empresa_id?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_analise_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_estabilidade: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          empresa_id: number
          id: string
          nome: string
          periodos_retirada: Json | null
          sigla: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          empresa_id?: number
          id?: string
          nome: string
          periodos_retirada?: Json | null
          sigla: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          empresa_id?: number
          id?: string
          nome?: string
          periodos_retirada?: Json | null
          sigla?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_estabilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          empresa_id: number | null
          id: number
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          empresa_id?: number | null
          id?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: number | null
          id?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          auth_id: string | null
          created_at: string
          email: string | null
          empresa_id: number | null
          id: string
          nome: string | null
          profile_type: Database["public"]["Enums"]["profile"] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_id?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: number | null
          id?: string
          nome?: string | null
          profile_type?: Database["public"]["Enums"]["profile"] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_id?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: number | null
          id?: string
          nome?: string | null
          profile_type?: Database["public"]["Enums"]["profile"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adicionar_versao_extra_com_codigo_unico: {
        Args:
          | {
              p_amostra_id: string
              p_codigo_base: string
              p_data_entrada: string
            }
          | {
              p_amostra_id: string
              p_codigo_base: string
              p_tipo_sigla: string
              p_data_entrada: string
            }
        Returns: undefined
      }
      debug_auth_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gerar_cronograma_com_versoes: {
        Args: {
          p_amostra_id: string
          p_codigo_base: string
          p_tipo_sigla: string
          p_data_entrada: string
        }
        Returns: undefined
      }
      gerar_proximo_codigo_amostra: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gerar_proximo_codigo_amostra_por_empresa: {
        Args: { p_empresa_id: number }
        Returns: string
      }
      get_current_user_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_unidades: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          unidade: string
        }[]
      }
      get_user_profile_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validar_retirada_amostra: {
        Args:
          | {
              p_codigo_versao: string
              p_usuario: string
              p_status_textual: string
              p_metodo: string
              p_observacoes?: string
              p_ip_address?: unknown
              p_user_agent?: string
            }
          | {
              p_codigo_versao: string
              p_usuario: string
              p_status_textual: string
              p_metodo: string
              p_observacoes?: string
              p_ip_address?: unknown
              p_user_agent?: string
              p_quantidade_retirada?: number
            }
        Returns: Json
      }
      validar_retirada_sequencial: {
        Args: { p_codigo_versao: string; p_amostra_id: string }
        Returns: Json
      }
    }
    Enums: {
      profile:
        | "administrador"
        | "gestor"
        | "analista_de_estabilidade"
        | "analista_de_laboratorio"
      status_analise: "Pendente" | "Em Análise" | "Concluído"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      profile: [
        "administrador",
        "gestor",
        "analista_de_estabilidade",
        "analista_de_laboratorio",
      ],
      status_analise: ["Pendente", "Em Análise", "Concluído"],
    },
  },
} as const
