import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Package, AlertCircle } from 'lucide-react';
import { ListaVersoesLote } from './ListaVersoesLote';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BuscaPorLoteProps {
  onAmostraSelecionada: (codigo: string, dataProgramada?: string, statusRetirada?: { id: string; descricao: string; }) => void;
}

interface VersaoDisponivel {
  id: string;
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  realizada: boolean | null;
  sequencia_valida?: boolean;
  amostra: {
    id: string;
    codigo: string;
    lote: string;
    status: string;
    nome_produto?: string;
    produtos?: {
      nome: string;
      fabricante: string;
    } | null;
  };
}

export const BuscaPorLote: React.FC<BuscaPorLoteProps> = ({ onAmostraSelecionada }) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [versoesEncontradas, setVersoesEncontradas] = useState<VersaoDisponivel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para validar se é próxima versão na sequência
  const validarSequenciaVersao = async (amostraId: string, numeroVersao: number) => {
    const { data: retiradas } = await supabase
      .from('retiradas_amostras')
      .select('codigo_amostra')
      .eq('amostra_id', amostraId)
      .order('created_at');

    const versoesRetiradas = retiradas?.map(r => {
      const partes = r.codigo_amostra.split('.');
      return parseInt(partes[1]);
    }).sort((a, b) => a - b) || [];

    const ultimaVersaoRetirada = versoesRetiradas.length > 0 ? 
      Math.max(...versoesRetiradas) : 0;

    return numeroVersao === ultimaVersaoRetirada + 1;
  };

  const buscarVersoesPorLote = async () => {
    if (!termoBusca.trim()) return;

    setIsSearching(true);
    setError(null);
    setVersoesEncontradas([]);

    try {
      // Buscar cronogramas de versões para amostras do lote específico
      const { data, error: searchError } = await supabase
        .from('cronograma_retiradas')
        .select(`
          id,
          codigo_versao,
          tempo_coleta,
          data_programada,
          realizada,
          amostra_id,
          amostras (
            id,
            codigo,
            lote,
            status,
            nome_produto,
            produtos (nome, fabricante)
          )
        `)
        .not('codigo_versao', 'is', null)
        .order('codigo_versao');

      if (searchError) {
        console.error('Erro na busca por lote:', searchError);
        setError('Erro ao buscar versões por lote');
        return;
      }

      // Filtrar apenas versões de amostras do lote especificado
      // Permitir busca tanto por lote quanto pelos números do código da amostra
      const versoesFiltradas = data?.filter((item: any) => {
        const lote = item.amostras?.lote?.toLowerCase() || '';
        const codigo = item.amostras?.codigo?.toLowerCase() || '';
        const termoBuscaLower = termoBusca.toLowerCase();
        
        // Extrair apenas os números do código da amostra para comparação
        const numerosCodigo = codigo.replace(/[^\d]/g, '');
        const numerosTermoBusca = termoBuscaLower.replace(/[^\d]/g, '');
        
        return (
          (lote.includes(termoBuscaLower) || 
           codigo.includes(termoBuscaLower) ||
           (numerosTermoBusca && numerosCodigo.includes(numerosTermoBusca))) &&
          !item.realizada && // Não foi retirada ainda
          item.amostras?.status && 
          !['cancelado', 'finalizado', 'retirada'].includes(item.amostras.status)
        );
      }) || [];

      // Verificar cada versão e aplicar regras de sequência
      const versoesComStatus = [];
      for (const versao of versoesFiltradas) {
        // Verificar se já foi retirada
        const { data: retiradaExistente } = await supabase
          .from('retiradas_amostras')
          .select('id')
          .eq('codigo_amostra', versao.codigo_versao)
          .maybeSingle();

        if (!retiradaExistente) {
          // Validar sequência
          const numeroVersao = parseInt(versao.codigo_versao.split('.')[1]);
          const sequenciaValida = await validarSequenciaVersao(versao.amostra_id, numeroVersao);
          
          versoesComStatus.push({
            id: versao.id,
            codigo_versao: versao.codigo_versao,
            tempo_coleta: versao.tempo_coleta,
            data_programada: versao.data_programada,
            realizada: false,
            sequencia_valida: sequenciaValida,
            amostra: versao.amostras
          });
        }
      }

      // Filtrar apenas a primeira versão válida na sequência para cada amostra
      const versoesValidasPorAmostra = new Map();
      
      versoesComStatus.forEach(versao => {
        const amostraId = versao.amostra.id;
        
        if (versao.sequencia_valida) {
          if (!versoesValidasPorAmostra.has(amostraId)) {
            versoesValidasPorAmostra.set(amostraId, versao);
          }
        }
      });

      const versoesDisponiveis = Array.from(versoesValidasPorAmostra.values());
      setVersoesEncontradas(versoesDisponiveis);

      if (versoesDisponiveis.length === 0) {
        setError(`Nenhuma versão disponível para retirada encontrada com o lote "${termoBusca}"`);
      }

    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro interno na busca por lote');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBuscar = async () => {
    await buscarVersoesPorLote();
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Digite o número do lote para buscar todas as amostras relacionadas.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="lote-busca">Número do Lote</Label>
        <div className="flex gap-2">
          <Input
            id="lote-busca"
            placeholder="Digite o número do lote..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
          />
          <Button 
            onClick={handleBuscar}
            disabled={!termoBusca.trim() || isSearching}
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {versoesEncontradas.length > 0 && (
        <ListaVersoesLote
          versoes={versoesEncontradas}
          onVersaoSelecionada={(codigo, dataProgramada, statusRetirada) => onAmostraSelecionada(codigo, dataProgramada, statusRetirada)}
          isLoading={isSearching}
        />
      )}
    </div>
  );
};