
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StatusMacroSubamostra = 'liberado_para_analise' | 'analise_iniciada' | 'analises_concluidas';

interface UseStatusMacroSubamostraProps {
  amostraId: string;
  codigoSubamostraId?: string;
}

interface StatusMacroResult {
  status: StatusMacroSubamostra | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStatusMacroSubamostra = ({ 
  amostraId, 
  codigoSubamostraId 
}: UseStatusMacroSubamostraProps): StatusMacroResult => {
  const [status, setStatus] = useState<StatusMacroSubamostra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularStatusMacro = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Calculando status macro para:', { amostraId, codigoSubamostraId });

      // Buscar todas as análises configuradas para esta amostra/subamostra
      let queryAnalises = supabase
        .from('amostra_analises')
        .select('id, tipo_analise_id')
        .eq('amostra_id', amostraId);

      // Se temos código de subamostra, filtrar por ele, senão buscar as sem código
      if (codigoSubamostraId) {
        queryAnalises = queryAnalises.eq('codigo_subamostra_id', codigoSubamostraId);
      } else {
        queryAnalises = queryAnalises.is('codigo_subamostra_id', null);
      }

      const { data: amostraAnalises, error: analisesError } = await queryAnalises;

      if (analisesError) throw analisesError;

      console.log('Análises configuradas:', amostraAnalises?.length || 0);

      // Se não encontrou análises específicas e temos codigoSubamostraId, buscar fallback
      let analisesFinais = amostraAnalises;

      if ((!amostraAnalises || amostraAnalises.length === 0) && codigoSubamostraId) {
        console.log('Buscando análises de pré-registro como fallback para status...');
        
        const { data: analisesFallback, error: fallbackError } = await supabase
          .from('amostra_analises')
          .select('id, tipo_analise_id')
          .eq('amostra_id', amostraId)
          .is('codigo_subamostra_id', null);

        if (fallbackError) throw fallbackError;

        analisesFinais = analisesFallback;
        console.log('Análises de fallback para status:', analisesFinais?.length || 0);
      }

      if (!analisesFinais || analisesFinais.length === 0) {
        console.log('Nenhuma análise configurada');
        setStatus(null);
        return;
      }

      // Buscar o status de cada análise
      const amostraAnaliseIds = analisesFinais.map(a => a.id);
      const { data: statusAnalises, error: statusError } = await supabase
        .from('status_analises_amostras')
        .select('status, amostra_analise_id')
        .eq('amostra_id', amostraId)
        .in('amostra_analise_id', amostraAnaliseIds);

      if (statusError) throw statusError;

      console.log('Status das análises:', statusAnalises?.length || 0);

      // Calcular status macro baseado nos status das análises
      const totalAnalises = analisesFinais.length;
      const analisesComStatus = statusAnalises || [];

      // Se não tem nenhuma análise iniciada
      if (analisesComStatus.length === 0) {
        console.log('Status: liberado_para_analise (nenhuma análise iniciada)');
        setStatus('liberado_para_analise');
        return;
      }

      // Contar análises por status
      const analisesConcluidas = analisesComStatus.filter(s => s.status === 'concluida').length;
      const analisesIniciadas = analisesComStatus.filter(s => s.status === 'em_andamento').length;

      console.log('Contadores:', { 
        totalAnalises, 
        analisesConcluidas, 
        analisesIniciadas,
        totalComStatus: analisesComStatus.length 
      });

      // CORREÇÃO: Se todas as análises configuradas estão concluídas
      if (analisesConcluidas === totalAnalises) {
        console.log('Status: analises_concluidas (todas as análises concluídas)');
        setStatus('analises_concluidas');
      }
      // Se pelo menos uma análise foi iniciada (em andamento ou concluída)
      else if (analisesIniciadas > 0 || analisesConcluidas > 0) {
        console.log('Status: analise_iniciada (pelo menos uma análise iniciada)');
        setStatus('analise_iniciada');
      }
      // Se todas as análises existem mas nenhuma foi iniciada
      else {
        console.log('Status: liberado_para_analise (análises configuradas mas não iniciadas)');
        setStatus('liberado_para_analise');
      }

    } catch (err) {
      console.error('Erro ao calcular status macro:', err);
      setError('Erro ao calcular status da subamostra');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (amostraId) {
      calcularStatusMacro();
    }
  }, [amostraId, codigoSubamostraId]);

  // Configurar listener para mudanças na tabela status_analises_amostras
  useEffect(() => {
    if (!amostraId) return;

    const channel = supabase
      .channel('status_analises_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_analises_amostras',
          filter: `amostra_id=eq.${amostraId}`
        },
        (payload) => {
          console.log('Status de análise mudou:', payload);
          calcularStatusMacro();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [amostraId, codigoSubamostraId]);

  return { status, isLoading, error, refetch: calcularStatusMacro };
};
