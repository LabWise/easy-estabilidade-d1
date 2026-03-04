import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Package, User, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoRetirada {
  id: string;
  usuario_retirada: string;
  data_retirada: string;
  codigo_amostra: string;
  quantidade_retirada: number;
}

interface ProdutoControladoData {
  qtd_controlado: number;
  un_controlado: number;
  tipo_controlado: string;
  unidade: string;
  produto_nome: string;
}

interface ModalRetiradaProdutoControladoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantidadeRetirada: number) => void;
  amostraId: string;
  codigoVersao: string;
  produtoControladoData: ProdutoControladoData | null;
  isLoading?: boolean;
}

export const ModalRetiradaProdutoControlado: React.FC<ModalRetiradaProdutoControladoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amostraId,
  codigoVersao,
  produtoControladoData,
  isLoading = false
}) => {
  const [quantidadeRetirada, setQuantidadeRetirada] = useState<string>('');
  const [historicoRetiradas, setHistoricoRetiradas] = useState<HistoricoRetirada[]>([]);
  const [totalRetirado, setTotalRetirado] = useState<number>(0);
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<number>(0);
  const [erro, setErro] = useState<string>('');
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    if (isOpen && amostraId) {
      buscarHistoricoRetiradas();
    }
  }, [isOpen, amostraId]);

  useEffect(() => {
    if (produtoControladoData) {
      const disponivel = produtoControladoData.qtd_controlado - totalRetirado;
      setQuantidadeDisponivel(disponivel);
    }
  }, [produtoControladoData, totalRetirado]);

  const buscarHistoricoRetiradas = async () => {
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
      const total = (data || []).reduce((sum, retirada) => 
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

  const handleConfirm = () => {
    const quantidade = parseFloat(quantidadeRetirada);
    
    if (!quantidade || quantidade <= 0) {
      setErro('Informe uma quantidade válida');
      return;
    }

    if (produtoControladoData && quantidade + totalRetirado > produtoControladoData.qtd_controlado) {
      setErro(`Quantidade excede o disponível. Máximo permitido: ${quantidadeDisponivel}`);
      return;
    }

    onConfirm(quantidade);
  };

  const handleClose = () => {
    setQuantidadeRetirada('');
    setErro('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Retirada de Produto Controlado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Produto */}
          {produtoControladoData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Produto</CardTitle>
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
          )}

          {/* Campo para quantidade a retirar */}
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
            />
            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Histórico de Retiradas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Retiradas</CardTitle>
            </CardHeader>
            <CardContent>
              {carregandoHistorico ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : historicoRetiradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma retirada anterior encontrada.</p>
              ) : (
                <div className="space-y-3">
                  {historicoRetiradas.map((retirada) => (
                    <div key={retirada.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{retirada.codigo_amostra}</Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-1" />
                          {retirada.usuario_retirada}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(retirada.data_retirada), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(retirada.data_retirada), 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {retirada.quantidade_retirada} {produtoControladoData?.unidade}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!quantidadeRetirada || !!erro || isLoading}
            >
              {isLoading ? 'Processando...' : 'Confirmar Retirada'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};