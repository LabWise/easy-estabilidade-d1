import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, Package, User, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SelecionarStatusRetirada } from './SelecionarStatusRetirada';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProdutoControladoData {
  qtd_controlado: number;
  un_controlado: number;
  tipo_controlado: string;
  unidade: string;
  produto_nome: string;
}

interface HistoricoRetirada {
  id: string;
  usuario_retirada: string;
  data_retirada: string;
  codigo_amostra: string;
  quantidade_retirada: number;
}

interface ModalJustificativaRetiradaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificativa: string, statusRetirada?: { id: string; descricao: string; }, quantidadeRetirada?: number) => Promise<void>;
  codigoVersao: string;
  dataProgramada: string;
  dataAtual: string;
  tipoValidacao: 'antecipada' | 'atrasada';
  statusSelecionado?: { id: string; descricao: string; } | null;
  isLoading?: boolean;
  // Novos props para produto controlado
  isProdutoControlado?: boolean;
  amostraId?: string;
  produtoControladoData?: ProdutoControladoData | null;
}

export const ModalJustificativaRetirada: React.FC<ModalJustificativaRetiradaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  codigoVersao,
  dataProgramada,
  dataAtual,
  tipoValidacao,
  statusSelecionado: statusInicial = null,
  isLoading = false,
  isProdutoControlado = false,
  amostraId,
  produtoControladoData
}) => {
  const [justificativa, setJustificativa] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState<{ id: string; descricao: string; } | null>(statusInicial);
  const [quantidadeRetirada, setQuantidadeRetirada] = useState<string>('');
  const [totalRetirado, setTotalRetirado] = useState<number>(0);
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<number>(0);
  const [erro, setErro] = useState<string>('');
  const [historicoRetiradas, setHistoricoRetiradas] = useState<HistoricoRetirada[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    if (isOpen && isProdutoControlado && amostraId) {
      buscarHistoricoRetiradas();
    }
  }, [isOpen, isProdutoControlado, amostraId]);

  useEffect(() => {
    if (produtoControladoData) {
      const disponivel = produtoControladoData.qtd_controlado - totalRetirado;
      setQuantidadeDisponivel(disponivel);
    }
  }, [produtoControladoData, totalRetirado]);

  const buscarHistoricoRetiradas = async () => {
    if (!amostraId) return;
    
    setCarregandoHistorico(true);
    try {
      const { data, error } = await supabase
        .from('retiradas_amostras')
        .select('id, usuario_retirada, data_retirada, codigo_amostra, quantidade_retirada')
        .eq('amostra_id', amostraId)
        .order('data_retirada', { ascending: false });

      if (error) throw error;

      setHistoricoRetiradas(data || []);
      
      // Calcular total já retirado
      const total = (data || []).reduce((sum: number, retirada: HistoricoRetirada) => 
        sum + (retirada.quantidade_retirada || 0), 0
      );
      setTotalRetirado(total);
    } catch (error) {
      console.error('Erro ao buscar histórico de retiradas:', error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleQuantidadeChange = (value: string) => {
    setQuantidadeRetirada(value);
    setErro('');
    
    const quantidade = parseFloat(value);
    if (quantidade && produtoControladoData) {
      if (quantidade + totalRetirado > produtoControladoData.qtd_controlado) {
        setErro(`Quantidade excede o disponível. Máximo permitido: ${quantidadeDisponivel}`);
      }
    }
  };

  const handleConfirm = async () => {
    if (!justificativa.trim() || !statusSelecionado) {
      return;
    }

    let quantidadeRetiradaFinal: number | undefined;
    
    if (isProdutoControlado) {
      const quantidade = parseFloat(quantidadeRetirada);
      
      if (!quantidade || quantidade <= 0) {
        setErro('Informe uma quantidade válida');
        return;
      }

      if (produtoControladoData && quantidade + totalRetirado > produtoControladoData.qtd_controlado) {
        setErro(`Quantidade excede o disponível. Máximo permitido: ${quantidadeDisponivel}`);
        return;
      }

      quantidadeRetiradaFinal = quantidade;
    }

    try {
      await onConfirm(justificativa, statusSelecionado, quantidadeRetiradaFinal);
      setJustificativa('');
      setStatusSelecionado(null);
      setQuantidadeRetirada('');
      setErro('');
      onClose();
    } catch (error) {
      console.error('Erro ao processar retirada:', error);
    }
  };

  const handleClose = () => {
    setJustificativa('');
    setStatusSelecionado(statusInicial);
    setQuantidadeRetirada('');
    setErro('');
    onClose();
  };

  const getTipoTexto = () => {
    return tipoValidacao === 'antecipada' ? 'Antecipada' : 'Atrasada';
  };

  const getDescricao = () => {
    if (tipoValidacao === 'antecipada') {
      return 'Esta amostra está sendo retirada antes da data programada. É necessário informar a justificativa para prosseguir.';
    }
    return 'Esta amostra está sendo retirada com mais de 5 dias após a data programada. É necessário informar a justificativa para prosseguir.';
  };

  const getVariantBadge = () => {
    return tipoValidacao === 'antecipada' ? 'secondary' : 'destructive';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Justificativa para Retirada {getTipoTexto()}
            {isProdutoControlado && (
              <Badge variant="outline" className="ml-2">
                <Package className="w-3 h-3 mr-1" />
                Produto Controlado
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="space-y-2">
              <p>{getDescricao()}</p>
              
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Código da Versão:</span>
                  <span className="font-mono">{codigoVersao}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Programada:</span>
                  <span>{new Date(dataProgramada).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Atual:</span>
                  <span>{new Date(dataAtual).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge variant={getVariantBadge()}>
                    Retirada {getTipoTexto()}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Status */}
          <SelecionarStatusRetirada
            value={statusSelecionado?.id}
            onChange={(statusId, statusDescricao) => 
              setStatusSelecionado({ id: statusId, descricao: statusDescricao })
            }
            disabled={isLoading}
          />

          {/* Seção de Produto Controlado */}
          {isProdutoControlado && produtoControladoData && (
            <>
              <Separator />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Informações do Produto Controlado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Produto</Label>
                      <p className="text-sm">{produtoControladoData.produto_nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Quantidade Enviada</Label>
                      <p className="text-sm">{produtoControladoData.qtd_controlado} {produtoControladoData.unidade}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Total Já Retirado</Label>
                      <p className="text-sm font-semibold">{totalRetirado} {produtoControladoData.unidade}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Quantidade Disponível</Label>
                      <p className="text-sm font-semibold text-green-600">{quantidadeDisponivel} {produtoControladoData.unidade}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade a Retirar *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={quantidadeDisponivel}
                  value={quantidadeRetirada}
                  onChange={(e) => handleQuantidadeChange(e.target.value)}
                  placeholder="Informe a quantidade"
                  className={erro ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {erro && (
                  <Alert variant="destructive">
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Histórico de Retiradas */}
              {historicoRetiradas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Retiradas Anteriores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carregandoHistorico ? (
                      <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {historicoRetiradas.slice(0, 5).map((retirada) => (
                          <div key={retirada.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">{retirada.codigo_amostra}</Badge>
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {retirada.usuario_retirada}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(retirada.data_retirada), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(retirada.data_retirada), 'HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <span className="font-medium">
                              {retirada.quantidade_retirada} {produtoControladoData.unidade}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Campo de Justificativa */}
          <div className="space-y-2">
            <label htmlFor="justificativa" className="text-sm font-medium">
              Justificativa (obrigatória)
            </label>
            <Textarea
              id="justificativa"
              placeholder="Informe a justificativa para esta retirada..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !justificativa.trim() || 
              !statusSelecionado || 
              isLoading ||
              (isProdutoControlado && (!quantidadeRetirada || !!erro))
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Retirada'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};