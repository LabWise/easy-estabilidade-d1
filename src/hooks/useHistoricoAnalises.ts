import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoItem {
  id: string;
  tipo_alteracao: string;
  justificativa: string;
  usuario_alteracao: string;
  data_alteracao: string;
  dados_antes: any;
  dados_depois: any;
}

interface UseHistoricoAnalisesProps {
  amostraId: string;
}

export const useHistoricoAnalises = ({ amostraId }: UseHistoricoAnalisesProps) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amostraId) {
      carregarHistorico();
    }
  }, [amostraId]);

  const carregarHistorico = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: historicoError } = await supabase
        .from('historico_alteracao_analises')
        .select('*')
        .eq('amostra_id', amostraId)
        .order('data_alteracao', { ascending: false });

      if (historicoError) throw historicoError;

      setHistorico(data || []);

    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar o histórico de alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoAlteracaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'adicao':
        return 'Adição';
      case 'edicao':
        return 'Edição';
      case 'remocao':
        return 'Remoção';
      default:
        return tipo;
    }
  };

  return {
    historico,
    isLoading,
    error,
    carregarHistorico,
    getTipoAlteracaoLabel
  };
};