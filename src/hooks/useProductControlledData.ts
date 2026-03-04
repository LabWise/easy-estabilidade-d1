import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Unidade {
  id: number;
  unidade: string;
}

interface Produto {
  id: string;
  nome: string;
}

export const useProductControlledData = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar unidades reais usando query SQL direta
        const { data: unidadesData, error: unidadesError } = await supabase
          .rpc('get_unidades') as { data: Unidade[] | null; error: any };

        if (unidadesError) {
          console.error('Erro ao carregar unidades:', unidadesError);
          // Usar dados reais conhecidos da tabela unidades
          setUnidades([
            { id: 1, unidade: 'Kg' },
            { id: 2, unidade: 'Caixas' },
            { id: 3, unidade: 'Litros' }
          ]);
        } else {
          setUnidades(unidadesData || []);
        }

        // Buscar produtos ativos
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (produtosError) {
          console.error('Erro ao carregar produtos:', produtosError);
        } else {
          setProdutos(produtosData || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    unidades,
    produtos,
    isLoading
  };
};