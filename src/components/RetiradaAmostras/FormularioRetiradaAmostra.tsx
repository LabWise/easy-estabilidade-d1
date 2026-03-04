
import React, { useState, useEffect } from 'react';
import { Search, QrCode, Loader2, Clock, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QrScannerModal } from '@/components/ui/qr-scanner-modal';
import { useRetiradaAmostra } from '@/hooks/useRetiradaAmostra';
import { ListaVersoesAmostra } from './ListaVersoesAmostra';
import { BuscaPorLote } from './BuscaPorLote';
import { ModalJustificativaRetirada } from './ModalJustificativaRetirada';
import { ModalRetiradaProdutoControlado } from './ModalRetiradaProdutoControlado';
import { SelecionarStatusRetirada } from './SelecionarStatusRetirada';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export const FormularioRetiradaAmostra = () => {
  const [codigo, setCodigo] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBuscaLote, setShowBuscaLote] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tipoBusca, setTipoBusca] = useState<'base' | 'versao' | null>(null);
  
  // Estados para seleção de status
  const [statusSelecionado, setStatusSelecionado] = useState<{
    id: string;
    descricao: string;
  } | null>(null);
  
  // Estados para modal de justificativa
  const [showModalJustificativa, setShowModalJustificativa] = useState(false);
  const [dadosRetiradaPendente, setDadosRetiradaPendente] = useState<{
    codigoVersao: string;
    dataProgramada: string;
    dataAtual: string;
    tipo: 'antecipada' | 'atrasada';
    statusSelecionado: { id: string; descricao: string; } | null;
  } | null>(null);

  // Estados para produto controlado
  const [showModalProdutoControlado, setShowModalProdutoControlado] = useState(false);
  const [produtoControladoData, setProdutoControladoData] = useState<any>(null);
  const [dadosProdutoControladoPendente, setDadosProdutoControladoPendente] = useState<{
    codigoVersao: string;
    amostraId: string;
    statusSelecionado: { id: string; descricao: string; } | null;
  } | null>(null);

  // Estados para confirmação de retirada
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRetirada, setPendingRetirada] = useState<{
    codigoVersao: string;
    dataProgramada?: string;
    statusSelecionado?: { id: string; descricao: string; };
    tipo: 'single' | 'lote';
  } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    statusConfiguracoes,
    isLoadingStatus,
    ultimaRetirada,
    amostraEncontrada,
    versoesDisponiveis,
    isValidating,
    validarCodigo,
    processarRetirada,
    isProcessing,
    processarRetiradaResult,
    verificarNecessidadeJustificativa,
    buscarProdutoControlado
  } = useRetiradaAmostra();

  // Buscar dados do produto controlado quando uma amostra é encontrada
  useEffect(() => {
    const buscarDadosProdutoControlado = async () => {
      if (amostraEncontrada?.produto_controlado) {
        try {
          const dados = await buscarProdutoControlado(amostraEncontrada.id);
          setProdutoControladoData(dados);
        } catch (error) {
          console.error('Erro ao buscar dados do produto controlado:', error);
        }
      } else {
        setProdutoControladoData(null);
      }
    };

    buscarDadosProdutoControlado();
  }, [amostraEncontrada, buscarProdutoControlado]);

  const confirmarRetirada = (codigoVersao: string, dataProgramada?: string, statusRetirada?: { id: string; descricao: string; }, tipo: 'single' | 'lote' = 'single') => {
    setPendingRetirada({ codigoVersao, dataProgramada, statusSelecionado: statusRetirada, tipo });
    setShowConfirmDialog(true);
  };

  const executarRetirada = async () => {
    if (!pendingRetirada) return;
    
    setShowConfirmDialog(false);
    await processarRetiradaVersao(pendingRetirada.codigoVersao, pendingRetirada.dataProgramada, pendingRetirada.statusSelecionado);
    setPendingRetirada(null);
  };

  const processarRetiradaVersao = async (codigoVersao: string, dataProgramada?: string, statusRetirada?: { id: string; descricao: string; }) => {
    try {
      // Validar se status foi selecionado
      const statusParaUsar = statusRetirada || statusSelecionado;
      if (!statusParaUsar) {
        toast({
          title: "Status obrigatório",
          description: "Por favor, selecione o status da retirada",
          variant: "destructive"
        });
        return;
      }

      // Verificar se é produto controlado
      const isProdutoControlado = amostraEncontrada?.produto_controlado || 
                                  versoesDisponiveis.some(v => v.codigo_versao === codigoVersao && v.produto_controlado);

      // Verificar se precisa de justificativa
      let precisaJustificativa = false;
      let dadosJustificativa = null;

      if (dataProgramada) {
        const validacao = verificarNecessidadeJustificativa(dataProgramada);
        if (validacao.necessita) {
          precisaJustificativa = true;
          dadosJustificativa = {
            codigoVersao,
            dataProgramada,
            dataAtual: validacao.dataAtual,
            tipo: validacao.tipo!,
            statusSelecionado: statusParaUsar
          };
        }
      }

      // Decidir qual modal mostrar baseado no tipo de produto e necessidade de justificativa
      if (isProdutoControlado && precisaJustificativa) {
        // Produto controlado + justificativa → ModalJustificativaRetirada com props de produto controlado
        setDadosRetiradaPendente(dadosJustificativa);
        setShowModalJustificativa(true);
      } else if (isProdutoControlado && !precisaJustificativa) {
        // Produto controlado + sem justificativa → ModalRetiradaProdutoControlado
        const amostraId = amostraEncontrada?.id || versoesDisponiveis.find(v => v.codigo_versao === codigoVersao)?.id;
        if (amostraId) {
          setDadosProdutoControladoPendente({
            codigoVersao,
            amostraId,
            statusSelecionado: statusParaUsar
          });
          setShowModalProdutoControlado(true);
        }
      } else if (!isProdutoControlado && precisaJustificativa) {
        // Produto normal + justificativa → ModalJustificativaRetirada sem props de produto controlado
        setDadosRetiradaPendente(dadosJustificativa);
        setShowModalJustificativa(true);
      } else {
        // Produto normal + sem justificativa → processar diretamente
        await processarRetiradaComJustificativa(codigoVersao, undefined, statusParaUsar);
      }
    } catch (error) {
      console.error('Erro ao processar retirada:', error);
      toast({
        title: "Erro interno",
        description: "Ocorreu um erro ao processar a retirada",
        variant: "destructive"
      });
    }
  };

  const processarRetiradaComJustificativa = async (
    codigoVersao: string, 
    justificativa?: string, 
    statusRetirada?: { id: string; descricao: string; },
    quantidadeRetirada?: number
  ) => {
    try {
      const statusParaUsar = statusRetirada || statusSelecionado;
      if (!statusParaUsar) {
        toast({
          title: "Status obrigatório",
          description: "Por favor, selecione o status da retirada",
          variant: "destructive"
        });
        return;
      }

      const resultado = await processarRetirada({
        codigoAmostra: codigoVersao,
        statusTextual: statusParaUsar.descricao,
        metodoIdentificacao: 'manual',
        usuario: user?.name || 'Usuário não identificado',
        justificativa,
        quantidadeRetirada
      });

      if (resultado.sucesso) {
        toast({
          title: "Retirada realizada com sucesso!",
          description: `Versão ${codigoVersao} foi retirada com status: ${statusParaUsar.descricao}`,
          variant: "default"
        });
        setErrorMessage('');
        setCodigo(''); // Limpar o campo de busca
        setStatusSelecionado(null); // Limpar status selecionado
      } else {
        toast({
          title: "Erro na retirada",
          description: resultado.erro || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao processar retirada:', error);
      toast({
        title: "Erro interno",
        description: "Ocorreu um erro ao processar a retirada",
        variant: "destructive"
      });
    }
  };

  const handleConfirmarComJustificativa = async (justificativa: string, statusRetirada?: { id: string; descricao: string; }, quantidadeRetirada?: number) => {
    if (dadosRetiradaPendente) {
      const statusParaUsar = statusRetirada || dadosRetiradaPendente.statusSelecionado;
      await processarRetiradaComJustificativa(dadosRetiradaPendente.codigoVersao, justificativa, statusParaUsar, quantidadeRetirada);
      setDadosRetiradaPendente(null);
    }
  };

  const handleConfirmarProdutoControlado = async (quantidadeRetirada: number) => {
    if (dadosProdutoControladoPendente) {
      await processarRetiradaComJustificativa(
        dadosProdutoControladoPendente.codigoVersao, 
        undefined, 
        dadosProdutoControladoPendente.statusSelecionado,
        quantidadeRetirada
      );
      setDadosProdutoControladoPendente(null);
      setShowModalProdutoControlado(false);
    }
  };

  const buscarDataProgramadaVersao = (codigoVersao: string): string | undefined => {
    // Para versão individual encontrada
    if (amostraEncontrada && amostraEncontrada.codigo_versao === codigoVersao) {
      return amostraEncontrada.data_programada;
    }
    
    // Para versões múltiplas
    const versao = versoesDisponiveis.find(v => v.codigo_versao === codigoVersao);
    return versao?.data_programada;
  };

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, informe o código da amostra",
        variant: "destructive"
      });
      return;
    }
    
    setErrorMessage('');
    // Determinar tipo de busca baseado na presença de ponto
    setTipoBusca(codigo.trim().includes('.') ? 'versao' : 'base');
    const resultado = await validarCodigo(codigo.trim());
    
    if (!resultado.valido && resultado.erro) {
      setErrorMessage(resultado.erro);
    }
  };

  const handleQRScan = async (codigoLido: string) => {
    setCodigo(codigoLido);
    setShowQRScanner(false);
    setErrorMessage('');
    
    // Determinar tipo de busca baseado na presença de ponto
    setTipoBusca(codigoLido.includes('.') ? 'versao' : 'base');
    // Validar automaticamente após scan
    const resultado = await validarCodigo(codigoLido);
    
    if (!resultado.valido && resultado.erro) {
      setErrorMessage(resultado.erro);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações da Última Retirada */}
      {ultimaRetirada && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <div className="flex items-center justify-center w-5 h-5 bg-emerald-600 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              Última Retirada Registrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código:</p>
                <p className="font-medium">{ultimaRetirada.codigo_amostra}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuário:</p>
                <p className="font-medium">{ultimaRetirada.usuario_retirada}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status:</p>
                <p className="font-medium">{ultimaRetirada.status_textual}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data:</p>
                <p className="font-medium">{new Date(ultimaRetirada.data_retirada).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca de Amostra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Localizar Amostra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código, números da amostra ou versão..."
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              className="flex-1"
            />
            <Button
              onClick={handleBuscar}
              disabled={isValidating || !codigo.trim()}
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQRScanner(true)}
              disabled={isValidating}
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBuscaLote(!showBuscaLote)}
            >
              {showBuscaLote ? 'Ocultar' : 'Buscar'} por Lote
            </Button>
          </div>

          {showBuscaLote && (
            <BuscaPorLote 
              onAmostraSelecionada={(codigoVersao, dataProgramada, statusRetirada) => 
                confirmarRetirada(codigoVersao, dataProgramada, statusRetirada, 'lote')
              }
            />
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Versão Individual Encontrada */}
      {amostraEncontrada && tipoBusca === 'versao' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Versão Localizada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código da Versão:</p>
                <p className="font-medium text-lg">{amostraEncontrada.codigo_versao}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo de Coleta:</p>
                <Badge variant="outline">{amostraEncontrada.tempo_coleta}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Programada:</p>
                <p className="font-medium">
                  {new Date(amostraEncontrada.data_programada).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status:</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Pronta para Retirada</Badge>
                  {amostraEncontrada.produto_controlado && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <Package className="w-3 h-3 mr-1" />
                      Produto Controlado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Seleção de Status */}
            <div className="pt-4 border-t">
              <SelecionarStatusRetirada
                value={statusSelecionado?.id}
                onChange={(statusId, statusDescricao) => 
                  setStatusSelecionado({ id: statusId, descricao: statusDescricao })
                }
                disabled={isProcessing}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => confirmarRetirada(
                  amostraEncontrada.codigo_versao, 
                  amostraEncontrada.data_programada,
                  statusSelecionado || undefined
                )}
                disabled={isProcessing || !statusSelecionado}
                className="w-full md:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Retirada'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Versões Múltiplas */}
      {versoesDisponiveis.length > 0 && (
        <ListaVersoesAmostra
          versoes={versoesDisponiveis}
          onVersaoSelecionada={(codigoVersao, statusRetirada) => {
            const dataProgramada = buscarDataProgramadaVersao(codigoVersao);
            confirmarRetirada(codigoVersao, dataProgramada, statusRetirada);
          }}
          isLoading={isProcessing}
        />
      )}

      {/* Modal QR Scanner */}
      <QrScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Escanear Etiqueta da Amostra"
      />

      {/* Modal de Justificativa */}
      {dadosRetiradaPendente && (
        <ModalJustificativaRetirada
          isOpen={showModalJustificativa}
          onClose={() => {
            setShowModalJustificativa(false);
            setDadosRetiradaPendente(null);
          }}
          onConfirm={handleConfirmarComJustificativa}
          codigoVersao={dadosRetiradaPendente.codigoVersao}
          dataProgramada={dadosRetiradaPendente.dataProgramada}
          dataAtual={dadosRetiradaPendente.dataAtual}
          tipoValidacao={dadosRetiradaPendente.tipo}
          statusSelecionado={dadosRetiradaPendente.statusSelecionado}
          isLoading={isProcessing}
          isProdutoControlado={amostraEncontrada?.produto_controlado || false}
          amostraId={amostraEncontrada?.id}
          produtoControladoData={produtoControladoData}
        />
      )}

      {/* Modal de Produto Controlado */}
      {dadosProdutoControladoPendente && produtoControladoData && (
        <ModalRetiradaProdutoControlado
          isOpen={showModalProdutoControlado}
          onClose={() => {
            setShowModalProdutoControlado(false);
            setDadosProdutoControladoPendente(null);
          }}
          onConfirm={handleConfirmarProdutoControlado}
          amostraId={dadosProdutoControladoPendente.amostraId}
          codigoVersao={dadosProdutoControladoPendente.codigoVersao}
          produtoControladoData={produtoControladoData}
          isLoading={isProcessing}
        />
      )}

      {/* Modal de Confirmação de Retirada */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Retirada de Amostra</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>Deseja confirmar a retirada da versão <strong>{pendingRetirada?.codigoVersao}</strong>?</div>
              {pendingRetirada?.statusSelecionado && (
                <div>Status: <strong>{pendingRetirada.statusSelecionado.descricao}</strong></div>
              )}
              {pendingRetirada?.dataProgramada && (
                <div>Data Programada: <strong>{new Date(pendingRetirada.dataProgramada).toLocaleDateString('pt-BR')}</strong></div>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Esta ação não pode ser desfeita.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRetirada(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={executarRetirada}>
              Confirmar Retirada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
