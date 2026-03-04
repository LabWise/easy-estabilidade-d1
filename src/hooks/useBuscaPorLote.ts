import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AmostraLote {
  id: string;
  codigo: string;
  lote: string;
  status: string;
  data_entrada: string;
  nome_produto?: string;
  produtos?: {
    nome: string;
    fabricante: string;
  } | null;
}

export const useBuscaPorLote = () => {
  const [amostrasEncontradas, setAmostrasEncontradas] = useState<AmostraLote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarPorLote = async (lote: string) => {
    setIsSearching(true);
    setError(null);
    setAmostrasEncontradas([]);

    try {
      const { data, error: searchError } = await supabase
        .from('amostras')
        .select(`
          id,
          codigo,
          lote,
          status,
          data_entrada,
          nome_produto,
          produtos(nome, fabricante)
        `)
        .ilike('lote', `%${lote}%`)
        .order('created_at', { ascending: false });

      if (searchError) {
        console.error('Erro na busca por lote:', searchError);
        setError('Erro ao buscar amostras por lote');
        return;
      }

      if (!data || data.length === 0) {
        setError(`Nenhuma amostra encontrada com o lote "${lote}"`);
        return;
      }

      // Filtrar apenas amostras que ainda não foram retiradas
      const amostrasComStatus = [];
      
      for (const amostra of data) {
        // Verificar se já foi retirada
        const { data: retiradaExistente } = await supabase
          .from('retiradas_amostras')
          .select('id')
          .eq('amostra_id', amostra.id)
          .maybeSingle();

        // Incluir apenas se não foi retirada e status permite retirada
        if (!retiradaExistente && (!amostra.status || !['cancelado', 'finalizada', 'retirada'].includes(amostra.status))) {
          amostrasComStatus.push(amostra);
        }
      }

      setAmostrasEncontradas(amostrasComStatus as AmostraLote[]);

      if (amostrasComStatus.length === 0) {
        setError(`Nenhuma amostra disponível para retirada encontrada com o lote "${lote}"`);
      }

    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro interno na busca por lote');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    amostrasEncontradas,
    isSearching,
    error,
    buscarPorLote
  };
};