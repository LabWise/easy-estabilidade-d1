import { supabase } from '@/integrations/supabase/client';
import { IFA, IFAFormData } from '@/types/ifa';

export const ifaService = {
  // Buscar todos os IFAs da empresa
  async buscarIFAs(): Promise<IFA[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ifa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar IFAs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço de buscar IFAs:', error);
      throw error;
    }
  },

  // Criar novo IFA
  async criarIFA(dadosIFA: IFAFormData): Promise<IFA> {
    try {
      const dadosFormatados = {
        ifa: dadosIFA.ifa,
        fabricante: dadosIFA.fabricante,
        dcb: dadosIFA.dcb,
        lote: dadosIFA.lote,
        data_fabricacao: dadosIFA.data_fabricacao,
        data_validade: dadosIFA.data_validade,
        endereco_fabricante: dadosIFA.endereco_fabricante,
        numero_cas: dadosIFA.numero_cas
      };

      const { data, error } = await (supabase as any)
        .from('ifa')
        .insert(dadosFormatados)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar IFA:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de criar IFA:', error);
      throw error;
    }
  },

  // Relacionar IFA com amostra
  async relacionarIFAAmostra(amostraId: string, ifaId: number): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('amostra_ifas')
        .insert({
          amostra_id: amostraId,
          ifa_id: ifaId
        });

      if (error) {
        console.error('Erro ao relacionar IFA com amostra:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço de relacionar IFA com amostra:', error);
      throw error;
    }
  },

  // Buscar IFAs de uma amostra
  async buscarIFAsAmostra(amostraId: string): Promise<IFA[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('amostra_ifas')
        .select(`
          ifa:ifa_id (
            id,
            ifa,
            fabricante,
            dcb,
            lote,
            data_fabricacao,
            data_validade,
            endereco_fabricante,
            numero_cas,
            empresa_id,
            created_at,
            updated_at
          )
        `)
        .eq('amostra_id', amostraId);

      if (error) {
        console.error('Erro ao buscar IFAs da amostra:', error);
        throw error;
      }

      return data?.map((item: any) => item.ifa) || [];
    } catch (error) {
      console.error('Erro no serviço de buscar IFAs da amostra:', error);
      throw error;
    }
  },

  // Atualizar IFA existente
  async atualizarIFA(id: number, dadosIFA: IFAFormData): Promise<IFA> {
    try {
      const dadosFormatados = {
        ifa: dadosIFA.ifa,
        fabricante: dadosIFA.fabricante,
        dcb: dadosIFA.dcb,
        lote: dadosIFA.lote,
        data_fabricacao: dadosIFA.data_fabricacao,
        data_validade: dadosIFA.data_validade,
        endereco_fabricante: dadosIFA.endereco_fabricante,
        numero_cas: dadosIFA.numero_cas
      };

      const { data, error } = await (supabase as any)
        .from('ifa')
        .update(dadosFormatados)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar IFA:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de atualizar IFA:', error);
      throw error;
    }
  },

  // Deletar IFA
  async deletarIFA(id: number): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('ifa')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar IFA:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço de deletar IFA:', error);
      throw error;
    }
  }
};