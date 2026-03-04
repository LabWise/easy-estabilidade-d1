import React, { useState, useEffect } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ModalResultadoAnaliseProps {
  amostraId: string;
  tipoAnaliseId: string;
  amostraAnaliseId?: string;
  codigoSubamostraId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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
}

interface TipoAnalise {
  descricao: string;
  detalhamento: string;
}

export const ModalResultadoAnalise: React.FC<ModalResultadoAnaliseProps> = ({
  amostraId,
  tipoAnaliseId,
  amostraAnaliseId,
  codigoSubamostraId,
  isOpen,
  onClose,
  onSave
}) => {
  const [statusAnalise, setStatusAnalise] = useState<StatusAnalise | null>(null);
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise | null>(null);
  const [resultados, setResultados] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen, amostraId, tipoAnaliseId]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carregar tipo de análise
      const { data: tipoData, error: tipoError } = await supabase
        .from('tipos_analise')
        .select('descricao, detalhamento')
        .eq('id', tipoAnaliseId)
        .single();

      if (tipoError) throw tipoError;
      setTipoAnalise(tipoData);

      // Carregar status da análise específica da subamostra se temos amostraAnaliseId
      let statusQuery = supabase
        .from('status_analises_amostras')
        .select('*')
        .eq('amostra_id', amostraId)
        .eq('tipo_analise_id', tipoAnaliseId);

      // Se temos amostraAnaliseId, filtrar especificamente por ele
      if (amostraAnaliseId) {
        statusQuery = statusQuery.eq('amostra_analise_id', amostraAnaliseId);
      }

      const { data: statusData, error: statusError } = await statusQuery.maybeSingle();

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError;
      }

      if (statusData) {
        setStatusAnalise(statusData);
        setResultados(statusData.resultados || '');
        setObservacoes(statusData.observacoes || '');
      }

    } catch (err) {
      console.error('Erro ao carregar dados da análise:', err);
      setError('Erro ao carregar os dados da análise.');
    } finally {
      setIsLoading(false);
    }
  };

  const salvarResultados = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user?.id)
        .single();

      const empresaId = userData?.empresa_id;

      if (statusAnalise) {
        // Atualizar análise existente
        const { error } = await supabase
          .from('status_analises_amostras')
          .update({
            status: 'concluida',
            data_conclusao: new Date().toISOString(),
            usuario_conclusao: user?.email || '',
            resultados,
            observacoes,
          })
          .eq('id', statusAnalise.id);

        if (error) throw error;
      } else {
        // Usar o amostraAnaliseId fornecido ou buscar o registro
        let amostraAnaliseIdToUse = amostraAnaliseId;

        if (!amostraAnaliseIdToUse) {
          // Buscar o amostra_analise_id se não foi fornecido
          let query = supabase
            .from('amostra_analises')
            .select('id')
            .eq('amostra_id', amostraId)
            .eq('tipo_analise_id', tipoAnaliseId);

          // Se temos codigoSubamostraId, filtrar por ele
          if (codigoSubamostraId) {
            query = query.eq('codigo_subamostra_id', codigoSubamostraId);
          }

          const { data: amostraAnalise } = await query.single();

          if (!amostraAnalise) {
            throw new Error('Registro de análise não encontrado');
          }

          amostraAnaliseIdToUse = amostraAnalise.id;
        }


        // Criar nova análise já concluída
        const { error } = await supabase
          .from('status_analises_amostras')
          .insert({
            amostra_id: amostraId,
            tipo_analise_id: tipoAnaliseId,
            amostra_analise_id: amostraAnaliseIdToUse,
            status: 'concluida',
            data_inicio: new Date().toISOString(),
            data_conclusao: new Date().toISOString(),
            usuario_conclusao: user?.email || '',
            resultados,
            observacoes,
            usuario_analista: user?.email || '',
            empresa_id: empresaId
          });

        if (error) throw error;
      }

      onSave();
      onClose();

    } catch (err) {
      console.error('Erro ao salvar resultados:', err);
      setError('Erro ao salvar os resultados da análise.');
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = statusAnalise?.status === 'concluida';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isReadOnly ? 'Resultados da Análise' : 'Concluir Análise'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {tipoAnalise && (
              <div>
                <h3 className="font-medium text-lg">{tipoAnalise.descricao}</h3>
                {tipoAnalise.detalhamento && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {tipoAnalise.detalhamento}
                  </p>
                )}
              </div>
            )}

            {statusAnalise && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">Iniciado em:</span>{' '}
                  {statusAnalise.data_inicio 
                    ? format(new Date(statusAnalise.data_inicio), 'dd/MM/yyyy HH:mm')
                    : 'Não informado'
                  }{' '}
                  por {statusAnalise.usuario_analista || 'Usuário não informado'}
                </div>
                {statusAnalise.data_conclusao && (
                  <div>
                    <span className="font-medium">Concluído em:</span>{' '}
                    {format(new Date(statusAnalise.data_conclusao), 'dd/MM/yyyy HH:mm')}{' '}
                    por {statusAnalise.usuario_conclusao || 'Usuário não informado'}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="resultados" className="text-sm font-medium">
                Resultados *
              </Label>
              <Textarea
                id="resultados"
                placeholder="Digite os resultados da análise..."
                value={resultados}
                onChange={(e) => setResultados(e.target.value)}
                disabled={isReadOnly}
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="observacoes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais (opcional)..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={isReadOnly}
                rows={4}
                className="mt-1"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                {isReadOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              
              {!isReadOnly && (
                <Button
                  onClick={salvarResultados}
                  disabled={isSaving || !resultados.trim()}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvar Resultados
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};