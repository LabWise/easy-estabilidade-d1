
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StatusRetirada {
  id: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

interface FormularioStatusProps {
  status?: StatusRetirada | null;
  onSalvar: () => void;
  onCancelar: () => void;
}

const FormularioStatus: React.FC<FormularioStatusProps> = ({ status, onSalvar, onCancelar }) => {
  const [descricao, setDescricao] = useState(status?.descricao || '');
  const [ativo, setAtivo] = useState(status?.ativo ?? true);
  const queryClient = useQueryClient();

  const criarStatus = useMutation({
    mutationFn: async (dados: { descricao: string; ativo: boolean; ordem: number }) => {
      const { data, error } = await supabase
        .from('status_retirada_configuracoes')
        .insert(dados)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-retirada-configuracoes'] });
      toast.success('Status criado com sucesso!');
      onSalvar();
    },
    onError: (error) => {
      console.error('Erro ao criar status:', error);
      toast.error('Erro ao criar status');
    },
  });

  const atualizarStatus = useMutation({
    mutationFn: async (dados: { id: string; descricao: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('status_retirada_configuracoes')
        .update({ 
          descricao: dados.descricao, 
          ativo: dados.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', dados.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-retirada-configuracoes'] });
      toast.success('Status atualizado com sucesso!');
      onSalvar();
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (status) {
      atualizarStatus.mutate({
        id: status.id,
        descricao: descricao.trim(),
        ativo
      });
    } else {
      // Buscar próxima ordem disponível
      const { data: statusExistentes } = await supabase
        .from('status_retirada_configuracoes')
        .select('ordem')
        .order('ordem', { ascending: false })
        .limit(1);

      const proximaOrdem = statusExistentes && statusExistentes.length > 0 
        ? statusExistentes[0].ordem + 1 
        : 1;

      criarStatus.mutate({
        descricao: descricao.trim(),
        ativo,
        ordem: proximaOrdem
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <SecureInput
          id="descricao"
          value={descricao}
          onChange={setDescricao}
          fieldName="descricao"
          placeholder="Ex: Conforme, Não conforme, Deteriorada..."
          required
          maxLength={100}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="ativo"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="ativo">Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancelar}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={criarStatus.isPending || atualizarStatus.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {criarStatus.isPending || atualizarStatus.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export const TabelaStatusRetirada: React.FC = () => {
  const [editandoStatus, setEditandoStatus] = useState<StatusRetirada | null>(null);
  const [criandoStatus, setCriandoStatus] = useState(false);
  const queryClient = useQueryClient();

  const { data: statusList = [], isLoading } = useQuery({
    queryKey: ['status-retirada-configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_retirada_configuracoes')
        .select('*')
        .order('ordem');

      if (error) {
        console.error('Erro ao buscar status:', error);
        throw error;
      }

      return data as StatusRetirada[];
    }
  });

  const alterarOrdem = useMutation({
    mutationFn: async ({ id, novaOrdem }: { id: string; novaOrdem: number }) => {
      const { error } = await supabase
        .from('status_retirada_configuracoes')
        .update({ ordem: novaOrdem, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-retirada-configuracoes'] });
      toast.success('Ordem alterada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao alterar ordem:', error);
      toast.error('Erro ao alterar ordem');
    },
  });

  const moverStatus = (status: StatusRetirada, direcao: 'cima' | 'baixo') => {
    const indiceAtual = statusList.findIndex(s => s.id === status.id);
    const novoIndice = direcao === 'cima' ? indiceAtual - 1 : indiceAtual + 1;
    
    if (novoIndice < 0 || novoIndice >= statusList.length) return;

    const statusTroca = statusList[novoIndice];
    
    // Trocar as ordens
    alterarOrdem.mutate({ id: status.id, novaOrdem: statusTroca.ordem });
    setTimeout(() => {
      alterarOrdem.mutate({ id: statusTroca.id, novaOrdem: status.ordem });
    }, 100);
  };

  const excluirStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('status_retirada_configuracoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-retirada-configuracoes'] });
      toast.success('Status excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir status:', error);
      toast.error('Erro ao excluir status');
    },
  });

  const handleExcluir = (status: StatusRetirada) => {
    if (confirm(`Tem certeza que deseja excluir o status "${status.descricao}"?`)) {
      excluirStatus.mutate(status.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status de Retirada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status de Retirada</CardTitle>
          <Button
            onClick={() => setCriandoStatus(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Status
          </Button>
        </CardHeader>
        <CardContent>
          {criandoStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Criar Novo Status</h3>
              <FormularioStatus
                onSalvar={() => setCriandoStatus(false)}
                onCancelar={() => setCriandoStatus(false)}
              />
            </div>
          )}

          {editandoStatus && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Editar Status</h3>
              <FormularioStatus
                status={editandoStatus}
                onSalvar={() => setEditandoStatus(null)}
                onCancelar={() => setEditandoStatus(null)}
              />
            </div>
          )}

          <div className="space-y-2">
            {statusList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum status cadastrado
              </div>
            ) : (
              statusList.map((status, index) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moverStatus(status, 'cima')}
                        disabled={index === 0 || alterarOrdem.isPending}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moverStatus(status, 'baixo')}
                        disabled={index === statusList.length - 1 || alterarOrdem.isPending}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div>
                      <div className="font-medium">{status.descricao}</div>
                      <div className="text-sm text-gray-500">
                        Ordem: {status.ordem} • Criado em: {new Date(status.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <Badge variant={status.ativo ? "default" : "secondary"}>
                      {status.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditandoStatus(status)}
                      disabled={editandoStatus?.id === status.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExcluir(status)}
                      disabled={excluirStatus.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
