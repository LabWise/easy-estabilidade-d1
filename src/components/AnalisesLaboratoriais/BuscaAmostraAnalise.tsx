
import React, { useState } from 'react';
import { Search, QrCode, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrScannerModal } from '@/components/ui/qr-scanner-modal';
import { supabase } from '@/integrations/supabase/client';
import { ListaAnalises } from './ListaAnalises';
import { useStatusMacroSubamostra } from '@/hooks/useStatusMacroSubamostra';
import { StatusBadge } from '@/components/ui/status-badge';

interface VersaoEncontrada {
  id: string;
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  realizada: boolean | null;
  amostra: {
    id: string;
    codigo: string;
    lote: string;
    status: string;
    nome_produto?: string;
    fabricante?: string;
    cliente?: string;
    data_entrada: string;
    produtos?: {
      nome: string;
      fabricante: string;
      codigo: string;
    } | null;
    tipos_estabilidade?: {
      nome: string;
      sigla: string;
    } | null;
    equipamentos?: {
      nome: string;
      codigo: string;
    } | null;
  };
}

export const BuscaAmostraAnalise = () => {
  const [codigo, setCodigo] = useState('');
  const [versoesEncontradas, setVersoesEncontradas] = useState<VersaoEncontrada[]>([]);
  const [versaoSelecionada, setVersaoSelecionada] = useState<VersaoEncontrada | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Hook para status macro da subamostra selecionada
  const { status: statusMacro, isLoading: isLoadingStatus } = useStatusMacroSubamostra({
    amostraId: versaoSelecionada?.amostra.id || '',
    codigoSubamostraId: versaoSelecionada?.id
  });

  const buscarVersoes = async (codigoBusca: string) => {
    if (!codigoBusca.trim()) {
      setError('Por favor, informe o código da amostra ou lote');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVersoesEncontradas([]);
    setVersaoSelecionada(null);

    try {
      // Buscar cronogramas de versões para amostras por código específico ou lote
      const { data, error: searchError } = await supabase
        .from('cronograma_retiradas')
        .select(`
          id,
          codigo_versao,
          tempo_coleta,
          data_programada,
          realizada,
          amostras (
            id,
            codigo,
            lote,
            status,
            nome_produto,
            fabricante,
            cliente,
            data_entrada,
            produtos (nome, fabricante, codigo),
            tipos_estabilidade (nome, sigla),
            equipamentos (nome, codigo)
          )
        `)
        .not('codigo_versao', 'is', null)
        .order('codigo_versao');

      if (searchError) {
        throw searchError;
      }

      if (!data || data.length === 0) {
        setError('Nenhuma versão encontrada');
        return;
      }

      // Filtrar por código específico, lote ou números da amostra
      const versoesFiltradas = data.filter((item: any) => {
        const codigoVersao = item.codigo_versao?.toLowerCase() || '';
        const loteAmostra = item.amostras?.lote?.toLowerCase() || '';
        const codigoAmostra = item.amostras?.codigo?.toLowerCase() || '';
        const codigoBuscaLower = codigoBusca.toLowerCase();
        
        // Extrair apenas os números do código da amostra para comparação
        const numerosCodigo = codigoAmostra.replace(/[^\d]/g, '');
        const numerosTermoBusca = codigoBuscaLower.replace(/[^\d]/g, '');
        
        return codigoVersao.includes(codigoBuscaLower) ||
               loteAmostra.includes(codigoBuscaLower) ||
               codigoAmostra.includes(codigoBuscaLower) ||
               (numerosTermoBusca && numerosCodigo.includes(numerosTermoBusca));
      });

      if (versoesFiltradas.length === 0) {
        setError(`Nenhuma versão encontrada para "${codigoBusca}"`);
        return;
      }

      // Verificar quais versões foram retiradas e estão prontas para análise
      const versoesDisponiveis = [];
      for (const versao of versoesFiltradas) {
        const { data: retiradaExistente } = await supabase
          .from('retiradas_amostras')
          .select('id')
          .eq('codigo_amostra', versao.codigo_versao)
          .maybeSingle();

        // Só incluir versões que foram retiradas
        if (retiradaExistente) {
          versoesDisponiveis.push({
            id: versao.id,
            codigo_versao: versao.codigo_versao,
            tempo_coleta: versao.tempo_coleta,
            data_programada: versao.data_programada,
            realizada: versao.realizada,
            amostra: versao.amostras
          });
        }
      }

      setVersoesEncontradas(versoesDisponiveis);

      if (versoesDisponiveis.length === 0) {
        setError(`Nenhuma amostra está disponível para análise no momento para "${codigoBusca}". Por favor, acesse o menu "Retirada de Amostras" para realizar a retirada antes de iniciar a Análise Laboratorial.`);
      }

    } catch (err) {
      console.error('Erro ao buscar versões:', err);
      setError('Erro ao buscar as versões. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    buscarVersoes(codigo);
  };

  const handleQRScan = (codigoLido: string) => {
    setCodigo(codigoLido);
    setShowQRScanner(false);
    buscarVersoes(codigoLido);
  };

  const selecionarVersao = (versao: VersaoEncontrada) => {
    setVersaoSelecionada(versao);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'retirada':
        return 'secondary';
      case 'finalizado':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Buscar Amostra para Análise
        </h2>
        <p className="text-muted-foreground">
          Digite o código da amostra ou lote, ou use o scanner QR para buscar a amostra que será analisada.
        </p>
      </div>

      {/* Busca */}
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
              placeholder="Digite o código, números da amostra ou lote..."
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !codigo.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQRScanner(true)}
              disabled={isLoading}
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

       {/* Lista de Versões Encontradas */}
      {versoesEncontradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Versões Encontradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versoesEncontradas.map((versao) => (
                <div key={versao.id} className="space-y-4">
                  {/* Card da Versão */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      versaoSelecionada?.id === versao.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => selecionarVersao(versao)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium font-mono">{versao.codigo_versao}</h3>
                          <Badge variant="outline">{versao.tempo_coleta}</Badge>
                          <Badge variant={getStatusBadgeVariant(versao.amostra.status)}>
                            {versao.amostra.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div title={versao.amostra.lote}>
                            <span className="font-medium">Lote:</span> 
                            <span className="break-words">
                              {versao.amostra.lote.length > 15 
                                ? `${versao.amostra.lote.substring(0, 15)}...` 
                                : versao.amostra.lote}
                            </span>
                          </div>
                          <div title={versao.amostra.produtos?.nome || versao.amostra.nome_produto}>
                            <span className="font-medium">Produto:</span> 
                            <span className="break-words">
                              {(versao.amostra.produtos?.nome || versao.amostra.nome_produto || '').length > 20 
                                ? `${(versao.amostra.produtos?.nome || versao.amostra.nome_produto || '').substring(0, 20)}...` 
                                : versao.amostra.produtos?.nome || versao.amostra.nome_produto}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Data Programada:</span> {new Date(versao.data_programada).toLocaleDateString('pt-BR')}
                          </div>
                          <div title={versao.amostra.produtos?.fabricante || versao.amostra.fabricante}>
                            <span className="font-medium">Fabricante:</span> 
                            <span className="break-words">
                              {(versao.amostra.produtos?.fabricante || versao.amostra.fabricante || '').length > 15 
                                ? `${(versao.amostra.produtos?.fabricante || versao.amostra.fabricante || '').substring(0, 15)}...` 
                                : versao.amostra.produtos?.fabricante || versao.amostra.fabricante}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {versaoSelecionada?.id === versao.id && (
                        <Badge variant="default">Selecionada</Badge>
                      )}
                    </div>
                  </div>

                   {/* Informações Detalhadas da Versão Selecionada - aparece logo abaixo da versão selecionada */}
                  {versaoSelecionada?.id === versao.id && (
                    <>
                      <Card className="ml-4 border-l-4 border-l-primary">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Detalhes da Versão: {versaoSelecionada.codigo_versao}</span>
                            <div className="flex items-center gap-2">
                              {statusMacro && !isLoadingStatus && (
                                <StatusBadge status={statusMacro} />
                              )}
                              <Badge variant={getStatusBadgeVariant(versaoSelecionada.amostra.status)}>
                                {versaoSelecionada.amostra.status}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Código Base
                              </label>
                              <p className="text-sm font-mono">{versaoSelecionada.amostra.codigo}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Lote
                              </label>
                              <p className="text-sm break-words" title={versaoSelecionada.amostra.lote}>
                                {versaoSelecionada.amostra.lote.length > 30 
                                  ? `${versaoSelecionada.amostra.lote.substring(0, 30)}...` 
                                  : versaoSelecionada.amostra.lote}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Data de Entrada
                              </label>
                              <p className="text-sm">
                                {new Date(versaoSelecionada.amostra.data_entrada).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Produto
                              </label>
                              <p className="text-sm break-words" title={versaoSelecionada.amostra.produtos?.nome || versaoSelecionada.amostra.nome_produto}>
                                {(versaoSelecionada.amostra.produtos?.nome || versaoSelecionada.amostra.nome_produto || '').length > 40 
                                  ? `${(versaoSelecionada.amostra.produtos?.nome || versaoSelecionada.amostra.nome_produto || '').substring(0, 40)}...` 
                                  : versaoSelecionada.amostra.produtos?.nome || versaoSelecionada.amostra.nome_produto}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Fabricante
                              </label>
                              <p className="text-sm">
                                {versaoSelecionada.amostra.produtos?.fabricante || versaoSelecionada.amostra.fabricante}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Cliente
                              </label>
                              <p className="text-sm">{versaoSelecionada.amostra.cliente}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Tipo de Estabilidade
                              </label>
                              <p className="text-sm">
                                {versaoSelecionada.amostra.tipos_estabilidade?.nome} ({versaoSelecionada.amostra.tipos_estabilidade?.sigla})
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Equipamento
                              </label>
                              <p className="text-sm break-words" title={`${versaoSelecionada.amostra.equipamentos?.nome} - ${versaoSelecionada.amostra.equipamentos?.codigo}`}>
                                {`${versaoSelecionada.amostra.equipamentos?.nome} - ${versaoSelecionada.amostra.equipamentos?.codigo}`.length > 30 
                                  ? `${`${versaoSelecionada.amostra.equipamentos?.nome} - ${versaoSelecionada.amostra.equipamentos?.codigo}`.substring(0, 30)}...` 
                                  : `${versaoSelecionada.amostra.equipamentos?.nome} - ${versaoSelecionada.amostra.equipamentos?.codigo}`}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Tempo de Coleta
                              </label>
                              <p className="text-sm">{versaoSelecionada.tempo_coleta}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Lista de Análises - aparece logo abaixo dos detalhes da versão selecionada */}
                      <ListaAnalises 
                        amostraId={versaoSelecionada.amostra.id} 
                        codigoSubamostraId={versaoSelecionada.id}
                        codigoVersao={versaoSelecionada.codigo_versao}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal QR Scanner */}
      <QrScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Escanear Etiqueta da Amostra"
      />
    </div>
  );
};
