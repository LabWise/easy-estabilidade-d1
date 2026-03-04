import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Settings } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TipoAnalise {
  id: string;
  descricao: string;
  detalhamento: string;
}

interface AnaliseConfiguracao {
  tipo_analise_id: string;
  selecionada: boolean;
  tipo_analise: TipoAnalise;
}

interface ModalGestaoAnalisesProps {
  amostra: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ModalGestaoAnalises: React.FC<ModalGestaoAnalisesProps> = ({
  amostra,
  isOpen,
  onClose,
  onSave
}) => {
  const [analises, setAnalises] = useState<AnaliseConfiguracao[]>([]);
  const [justificativa, setJustificativa] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isPreRegistro = amostra?.tipo_registro === 'pre-registro';

  // Reset justificativa when modal opens/closes or amostra changes
  useEffect(() => {
    if (isOpen) {
      setJustificativa('');
      setError(null);
      if (amostra) {
        carregarAnalises();
      }
    } else {
      setJustificativa('');
      setError(null);
    }
  }, [isOpen, amostra?.id]);

  const carregarAnalises = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carregar todos os tipos de análise disponíveis
      const { data: tiposAnalise, error: tiposError } = await supabase
        .from('tipos_analise')
        .select('*')
        .eq('ativo', true)
        .order('descricao');

      if (tiposError) throw tiposError;

      // Carregar análises já configuradas para esta amostra
      const { data: analisesConfiguradas, error: configError } = await supabase
        .from('amostra_analises')
        .select(`
          tipo_analise_id,
          tipos_analise (*)
        `)
        .eq('amostra_id', amostra.id);

      if (configError) throw configError;

      // Combinar dados
      const analisesConfig: AnaliseConfiguracao[] = tiposAnalise.map(tipo => {
        const jaConfigurada = analisesConfiguradas?.some(ac => ac.tipo_analise_id === tipo.id);
        return {
          tipo_analise_id: tipo.id,
          selecionada: jaConfigurada || false,
          tipo_analise: tipo
        };
      });

      setAnalises(analisesConfig);

    } catch (err) {
      console.error('Erro ao carregar análises:', err);
      setError('Erro ao carregar as análises disponíveis.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnalise = (tipoAnaliseId: string) => {
    setAnalises(prev => prev.map(analise => 
      analise.tipo_analise_id === tipoAnaliseId 
        ? { ...analise, selecionada: !analise.selecionada }
        : analise
    ));
  };

  const salvarAlteracoes = async () => {
    if (!justificativa.trim()) {
      setError('A justificativa é obrigatória para salvar as alterações.');
      return;
    }

    // Verificar autenticação básica
    if (!user) {
      setError('Usuário não autenticado. Faça login novamente.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user?.id)
        .single();

      const empresaId = userData?.empresa_id;

      // Buscar análises atualmente configuradas
      const { data: analisesAtuais } = await supabase
        .from('amostra_analises')
        .select('tipo_analise_id')
        .eq('amostra_id', amostra.id);

      const tiposAtuais = new Set(analisesAtuais?.map(a => a.tipo_analise_id) || []);
      const tiposNovos = new Set(analises.filter(a => a.selecionada).map(a => a.tipo_analise_id));

      // Análises para adicionar
      const paraAdicionar = analises.filter(a => 
        a.selecionada && !tiposAtuais.has(a.tipo_analise_id)
      );

      // Análises para remover
      const paraRemover = analises.filter(a => 
        !a.selecionada && tiposAtuais.has(a.tipo_analise_id)
      );

      // Registrar no histórico antes das alterações
      const alteracoes = {
        adicoes: paraAdicionar.map(a => a.tipo_analise.descricao),
        remocoes: paraRemover.map(a => a.tipo_analise.descricao)
      };

      if (alteracoes.adicoes.length > 0 || alteracoes.remocoes.length > 0) {
        await supabase
          .from('historico_alteracao_analises')
          .insert({
            amostra_id: amostra.id,
            tipo_alteracao: isPreRegistro ? 'adicao' : 'edicao',
            justificativa,
            usuario_alteracao: user?.email || 'Sistema',
            dados_antes: { tipos_atuais: Array.from(tiposAtuais) },
            dados_depois: { tipos_novos: Array.from(tiposNovos) },
            empresa_id: empresaId
          });
      }

      // Adicionar novas análises
      if (paraAdicionar.length > 0) {
        const novasAnalises = paraAdicionar.map(analise => ({
          amostra_id: amostra.id,
          tipo_analise_id: analise.tipo_analise_id,
          codigo_subamostra_id: null, // Para pré-registro, deixar null
          empresa_id: empresaId
        }));

        const { error: insertError } = await supabase
          .from('amostra_analises')
          .insert(novasAnalises);

        if (insertError) {
          if (insertError.message.includes('row-level security')) {
            throw new Error('Erro de autenticação. Tente fazer login novamente.');
          }
          throw insertError;
        }
      }

      // Remover análises desmarcadas
      if (paraRemover.length > 0) {
        const { error: deleteError } = await supabase
          .from('amostra_analises')
          .delete()
          .eq('amostra_id', amostra.id)
          .in('tipo_analise_id', paraRemover.map(a => a.tipo_analise_id));

        if (deleteError) {
          if (deleteError.message.includes('row-level security')) {
            throw new Error('Erro de autenticação. Tente fazer login novamente.');
          }
          throw deleteError;
        }
      }

      onSave();
      onClose();

    } catch (err: any) {
      console.error('Erro ao salvar alterações:', err);
      
      if (err.message && (err.message.includes('autenticação') || err.message.includes('Sessão expirada'))) {
        setError('Sua sessão expirou. Faça login novamente.');
      } else {
        setError('Erro ao salvar as alterações nas análises.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setJustificativa('');
    setError(null);
    onClose();
  };

  const analisesAtivas = analises.filter(a => a.selecionada).length;
  const totalAnalises = analises.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPreRegistro ? (
              <>
                <Plus className="h-5 w-5" />
                Adicionar Análises
              </>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Editar Análises
              </>
            )}
            - {amostra?.codigo}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando análises...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-accent/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Informações da Amostra</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Código:</span> {amostra?.codigo}
                </div>
                <div>
                  <span className="font-medium">Lote:</span> {amostra?.lote}
                </div>
                <div>
                  <span className="font-medium">Produto:</span> {amostra?.nome_produto || amostra?.produtos?.nome}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {isPreRegistro ? 'Pré-Registro' : 'Pós-Registro'}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Análises Disponíveis ({analisesAtivas}/{totalAnalises} selecionadas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {analises.map((analise) => (
                    <div
                      key={analise.tipo_analise_id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`analise-${analise.tipo_analise_id}`}
                          checked={analise.selecionada}
                          onCheckedChange={() => toggleAnalise(analise.tipo_analise_id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`analise-${analise.tipo_analise_id}`}
                            className="font-medium cursor-pointer"
                          >
                            {analise.tipo_analise.descricao}
                          </label>
                          {analise.tipo_analise.detalhamento && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {analise.tipo_analise.detalhamento}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="justificativa" className="text-sm font-medium">
                Justificativa *
              </Label>
              <Textarea
                id="justificativa"
                placeholder="Descreva o motivo da alteração nas análises..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A justificativa é obrigatória e será registrada no histórico.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              
              <Button
                onClick={salvarAlteracoes}
                disabled={isSaving || !justificativa.trim()}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {isPreRegistro ? 'Adicionar Análises' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
