

import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle, Play, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ModalResultadoAnalise } from './ModalResultadoAnalise';

interface TipoAnalise {
  id: string;
  descricao: string;
  detalhamento: string;
}

interface StatusAnalise {
  id: string;
  status: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  resultados: string | null;
  observacoes: string | null;
  usuario_analista: string | null;
  usuario_conclusao: string | null;
  tipo_analise_id: string;
  codigo_subamostra_id?: string | null;
}

interface AnaliseItem extends TipoAnalise {
  statusAnalise?: StatusAnalise;
  amostraAnaliseId?: string;
}

interface ListaAnalisesProps {
  amostraId: string;
  codigoSubamostraId?: string;
  codigoVersao?: string;
}

export const ListaAnalises: React.FC<ListaAnalisesProps> = ({ amostraId, codigoSubamostraId, codigoVersao }) => {
  const [analises, setAnalises] = useState<AnaliseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAnaliseId, setModalAnaliseId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    carregarAnalises();
  }, [amostraId, codigoSubamostraId]);

  const carregarAnalises = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Carregando análises para:', { amostraId, codigoSubamostraId, codigoVersao });

      // Primeiro, tentar buscar análises específicas para a versão
      let queryAnalises = supabase
        .from('amostra_analises')
        .select(`
          id,
          tipo_analise_id,
          codigo_subamostra_id,
          tipos_analise!inner (
            id,
            descricao,
            detalhamento
          )
        `)
        .eq('amostra_id', amostraId);

      // Se temos código de subamostra, filtrar por ele
      if (codigoSubamostraId) {
        queryAnalises = queryAnalises.eq('codigo_subamostra_id', codigoSubamostraId);
      } else {
        // Para pré-registros, buscar análises sem código
        queryAnalises = queryAnalises.is('codigo_subamostra_id', null);
      }

      const { data: amostraAnalises, error: analisesError } = await queryAnalises;

      if (analisesError) throw analisesError;

      console.log('Análises específicas encontradas:', amostraAnalises?.length || 0);

      // Se não encontrou análises específicas e temos codigoSubamostraId, 
      // implementar fallback para análises de pré-registro
      let analisesFinais = amostraAnalises;

      if ((!amostraAnalises || amostraAnalises.length === 0) && codigoSubamostraId) {
        console.log('Buscando análises de pré-registro como fallback...');
        
        const { data: analisesFallback, error: fallbackError } = await supabase
          .from('amostra_analises')
          .select(`
            id,
            tipo_analise_id,
            codigo_subamostra_id,
            tipos_analise!inner (
              id,
              descricao,
              detalhamento
            )
          `)
          .eq('amostra_id', amostraId)
          .is('codigo_subamostra_id', null);

        if (fallbackError) throw fallbackError;

        analisesFinais = analisesFallback;
        console.log('Análises de fallback encontradas:', analisesFinais?.length || 0);
      }

      if (!analisesFinais || analisesFinais.length === 0) {
        setError(codigoSubamostraId 
          ? `No momento do cadastro da amostra, foi selecionada a opção "Pré-Registro". Por esse motivo, nenhuma análise laboratorial foi vinculada a versão ${codigoVersao || 'selecionada'}.
Para prosseguir, acesse o menu "Gestão de Amostras" e utilize a função "Adicionar Análises" para completar o processo.`
          : 'No momento do cadastro da amostra, foi selecionada a opção "Pré-Registro". Por esse motivo, nenhuma análise laboratorial foi vinculada a esta etiqueta. Para prosseguir, acesse o menu "Gestão de Amostras" e utilize a função "Adicionar Análises" para completar o processo.'
        );
        return;
      }

      // Buscar o status de cada análise
      const amostraAnaliseIds = analisesFinais.map(a => a.id);
      
      let statusQuery = supabase
        .from('status_analises_amostras')
        .select('*')
        .eq('amostra_id', amostraId)
        .in('amostra_analise_id', amostraAnaliseIds);

      const { data: statusAnalises, error: statusError } = await statusQuery;

      if (statusError) throw statusError;

      console.log('Status das análises:', statusAnalises?.length || 0);

      // Combinar os dados
      const analisesComStatus: AnaliseItem[] = analisesFinais.map(amostraAnalise => {
        const tipoAnalise = amostraAnalise.tipos_analise;
        
        // Buscar status específico para esta amostra_analise_id
        const statusAnalise = statusAnalises?.find(s => 
          s.amostra_analise_id === amostraAnalise.id &&
          s.tipo_analise_id === tipoAnalise.id
        );

        return {
          id: tipoAnalise.id,
          descricao: tipoAnalise.descricao,
          detalhamento: tipoAnalise.detalhamento,
          statusAnalise,
          amostraAnaliseId: amostraAnalise.id
        };
      });

      setAnalises(analisesComStatus);

    } catch (err) {
      console.error('Erro ao carregar análises:', err);
      setError('Erro ao carregar as análises da amostra.');
    } finally {
      setIsLoading(false);
    }
  };

  const iniciarAnalise = async (tipoAnaliseId: string) => {
    try {
      console.log('Iniciando análise:', { tipoAnaliseId, amostraId, codigoSubamostraId });

      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user?.id)
        .single();

      const empresaId = userData?.empresa_id;

      // Buscar o registro correto em amostra_analises
      let amostraAnaliseId: string;

      if (codigoSubamostraId) {
        // Primeiro tentar buscar análise específica da versão com query limpa
        console.log('Buscando análise específica para a versão...');
        const { data: analiseEspecifica, error: errorEspecifica } = await supabase
          .from('amostra_analises')
          .select('id')
          .eq('amostra_id', amostraId)
          .eq('tipo_analise_id', tipoAnaliseId)
          .eq('codigo_subamostra_id', codigoSubamostraId)
          .maybeSingle();

        if (errorEspecifica) {
          console.error('Erro ao buscar análise específica:', errorEspecifica);
          throw errorEspecifica;
        }

        if (analiseEspecifica) {
          console.log('Análise específica encontrada:', analiseEspecifica.id);
          amostraAnaliseId = analiseEspecifica.id;
        } else {
          // Se não encontrou específica, buscar a global (pré-registro) com query completamente nova
          console.log('Análise específica não encontrada, buscando análise de pré-registro...');
          const { data: analiseGlobal, error: errorGlobal } = await supabase
            .from('amostra_analises')
            .select('id')
            .eq('amostra_id', amostraId)
            .eq('tipo_analise_id', tipoAnaliseId)
            .is('codigo_subamostra_id', null)
            .maybeSingle();

          if (errorGlobal) {
            console.error('Erro ao buscar análise global:', errorGlobal);
            throw errorGlobal;
          }

          if (!analiseGlobal) {
            throw new Error('Registro de análise não encontrado');
          }

          console.log('Análise de pré-registro encontrada:', analiseGlobal.id);
          amostraAnaliseId = analiseGlobal.id;
        }
      } else {
        // Para pré-registros, buscar análise sem código de subamostra com query limpa
        console.log('Buscando análise de pré-registro...');
        const { data: analiseGlobal, error: errorGlobal } = await supabase
          .from('amostra_analises')
          .select('id')
          .eq('amostra_id', amostraId)
          .eq('tipo_analise_id', tipoAnaliseId)
          .is('codigo_subamostra_id', null)
          .maybeSingle();

        if (errorGlobal) {
          console.error('Erro ao buscar análise global:', errorGlobal);
          throw errorGlobal;
        }

        if (!analiseGlobal) {
          throw new Error('Registro de análise não encontrado');
        }

        console.log('Análise de pré-registro encontrada:', analiseGlobal.id);
        amostraAnaliseId = analiseGlobal.id;
      }

      console.log('Inserindo status de análise com amostraAnaliseId:', amostraAnaliseId);

      // Inserir o status da análise
      const { error: insertError } = await supabase
        .from('status_analises_amostras')
        .insert({
          amostra_id: amostraId,
          tipo_analise_id: tipoAnaliseId,
          amostra_analise_id: amostraAnaliseId,
          status: 'em_andamento',
          data_inicio: new Date().toISOString(),
          usuario_analista: user?.email || '',
          empresa_id: empresaId
        });

      if (insertError) {
        console.error('Erro ao inserir status:', insertError);
        throw insertError;
      }

      console.log('Análise iniciada com sucesso');
      await carregarAnalises();

    } catch (err) {
      console.error('Erro ao iniciar análise:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar a análise.');
    }
  };

  const concluirAnalise = (tipoAnaliseId: string) => {
    setModalAnaliseId(tipoAnaliseId);
  };

  const handleAnaliseConfirmada = async () => {
    await carregarAnalises();
    setModalAnaliseId(null);
  };

  const getStatusBadge = (analise: AnaliseItem) => {
    if (!analise.statusAnalise) {
      return <Badge variant="outline">Pendente</Badge>;
    }

    switch (analise.statusAnalise.status) {
      case 'em_andamento':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'concluida':
        return <Badge variant="secondary">Concluída</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getStatusIcon = (analise: AnaliseItem) => {
    if (!analise.statusAnalise) {
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }

    switch (analise.statusAnalise.status) {
      case 'em_andamento':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando análises...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {codigoVersao ? `Análises da Versão ${codigoVersao}` : 'Análises da Amostra'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analises.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma análise configurada para esta amostra.
            </p>
          ) : (
            <div className="grid gap-4">
              {analises.map((analise) => (
                <div
                  key={analise.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(analise)}
                        <h3 className="font-medium">{analise.descricao}</h3>
                        {getStatusBadge(analise)}
                      </div>
                      
                      {analise.detalhamento && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {analise.detalhamento}
                        </p>
                      )}

                      {analise.statusAnalise && (
                        <div className="text-sm text-muted-foreground space-y-2">
                          {analise.statusAnalise.data_inicio && (
                            <div>
                              <span className="font-medium">Iniciado em:</span>{' '}
                              {format(new Date(analise.statusAnalise.data_inicio), 'dd/MM/yyyy HH:mm')}{' '}
                              por {analise.statusAnalise.usuario_analista || 'Usuário não informado'}
                            </div>
                          )}

                          {analise.statusAnalise.data_conclusao && (
                            <div>
                              <span className="font-medium">Concluído em:</span>{' '}
                              {format(new Date(analise.statusAnalise.data_conclusao), 'dd/MM/yyyy HH:mm')}{' '}
                              por {analise.statusAnalise.usuario_conclusao || 'Usuário não informado'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!analise.statusAnalise && (
                        <Button
                          size="sm"
                          onClick={() => iniciarAnalise(analise.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      
                      {analise.statusAnalise?.status === 'em_andamento' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => concluirAnalise(analise.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      
                      {analise.statusAnalise?.status === 'concluida' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalAnaliseId(analise.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Resultados
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {modalAnaliseId && (
        <ModalResultadoAnalise
          amostraId={amostraId}
          tipoAnaliseId={modalAnaliseId}
          amostraAnaliseId={analises.find(a => a.id === modalAnaliseId)?.amostraAnaliseId}
          codigoSubamostraId={codigoSubamostraId}
          isOpen={!!modalAnaliseId}
          onClose={() => setModalAnaliseId(null)}
          onSave={handleAnaliseConfirmada}
        />
      )}
    </div>
  );
};
