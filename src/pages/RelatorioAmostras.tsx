
import React, { useState } from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { FiltrosRelatorio } from '../components/Relatorios/FiltrosRelatorio';
import { TabelaRelatorio } from '../components/Relatorios/TabelaRelatorio';
import { ResumoEstatisticas } from '../components/Relatorios/ResumoEstatisticas';
import { TabelaDinamica } from '../components/Relatorios/TabelaDinamica';
import { GraficoAmostrasEquipamento } from '../components/Relatorios/Analytics/GraficoAmostrasEquipamento';
import { GraficoFluxoMensal } from '../components/Relatorios/Analytics/GraficoFluxoMensal';
import { GraficoAnalisesPendentes } from '../components/Relatorios/Analytics/GraficoAnalisesPendentes';
import { GraficoQuarentenaAnalise } from '../components/Relatorios/Analytics/GraficoQuarentenaAnalise';
import { useRelatorioAmostras } from '../hooks/useRelatorioAmostras';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, Table, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RelatorioAmostras = () => {
  const [abaSelecionada, setAbaSelecionada] = useState('visao-geral');
  
  const {
    dadosFiltrados,
    dadosExpandidos,
    dadosPaginados,
    isLoading: loadingRelatorio,
    error,
    filtroRapido,
    setFiltroRapido,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    searchTerm,
    setSearchTerm,
    handleExportCSV,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    itensPorPagina
  } = useRelatorioAmostras();

  const {
    equipamentoMetrics,
    fluxoMensal,
    analisesPendentes,
    statusAmostras,
    isLoading: loadingAnalytics
  } = useAnalyticsData();

  const handleExportXLS = async () => {
    try {
      // Dinamicamente importar a biblioteca xlsx apenas quando necessário
      const XLSX = await import('xlsx');
      
      // Preparar dados para múltiplas abas
      const workbook = XLSX.utils.book_new();
      
      // Aba 1: Dados detalhados
      const wsData = XLSX.utils.json_to_sheet(dadosExpandidos.map(item => ({
        'Código': item.cronograma?.codigo_versao || item.codigo,
        'Produto': item.produtos?.nome || '',
        'Lote': item.lote,
        'Fabricante': item.produtos?.fabricante || '',
        'Equipamento': item.equipamentos?.nome || '',
        'Tipo Estabilidade': item.tipos_estabilidade?.sigla || '',
        'Status': item.status,
        'Tempo Coleta': item.cronograma?.tempo_coleta || '',
        'Data Programada': item.cronograma?.data_programada || '',
        'Data Realizada': item.cronograma?.data_realizada || '',
        'Realizada': item.cronograma?.realizada ? 'Sim' : 'Não'
      })));
      XLSX.utils.book_append_sheet(workbook, wsData, 'Dados Detalhados');
      
      // Aba 2: Equipamentos
      if (equipamentoMetrics?.length) {
        const wsEquip = XLSX.utils.json_to_sheet(equipamentoMetrics.map(item => ({
          'Equipamento': item.equipamento_nome,
          'Pré-registro': item.pre_registro,
          'Pós-registro': item.pos_registro,
          'Total': item.total
        })));
        XLSX.utils.book_append_sheet(workbook, wsEquip, 'Por Equipamento');
      }
      
      // Aba 3: Fluxo Mensal
      if (fluxoMensal?.length) {
        const wsFluxo = XLSX.utils.json_to_sheet(fluxoMensal.map(item => ({
          'Mês': item.mes,
          'Entradas': item.entradas,
          'Saídas': item.saidas,
          'Taxa Ocupação (%)': item.taxa_ocupacao.toFixed(1)
        })));
        XLSX.utils.book_append_sheet(workbook, wsFluxo, 'Fluxo Mensal');
      }
      
      // Aba 4: Análises Pendentes
      if (analisesPendentes?.length) {
        const wsAnalises = XLSX.utils.json_to_sheet(analisesPendentes.map(item => ({
          'Faixa de Dias': item.faixa_dias,
          'Quantidade': item.quantidade,
          'Crítico': item.critico ? 'Sim' : 'Não'
        })));
        XLSX.utils.book_append_sheet(workbook, wsAnalises, 'Análises Pendentes');
      }
      
      // Salvar arquivo
      const fileName = `relatorio_amostras_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Erro ao exportar XLS:', error);
      // Fallback para CSV
      handleExportCSV();
    }
  };

  if (error) {
    return (
      <ResponsiveLayout title="Relatórios">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do relatório. Tente novamente.
          </AlertDescription>
        </Alert>
      </ResponsiveLayout>
    );
  }

  const isLoading = loadingRelatorio || loadingAnalytics;

  return (
    <ResponsiveLayout title="Dashboard de Análises">
      <div className="space-y-6">
        {/* Header com filtros e exportação */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Relatórios e Análises</h2>
                <p className="text-muted-foreground">
                  Dashboard completo com métricas e análises de amostras
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportCSV} 
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  onClick={handleExportXLS} 
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar XLS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de navegação */}
        <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visao-geral" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <Table className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="dinamica" className="gap-2">
              <Table className="h-4 w-4" />
              Tabela Dinâmica
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das abas */}
          <TabsContent value="visao-geral" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <Skeleton className="h-96" />
              </div>
            ) : (
              <ResumoEstatisticas dados={dadosFiltrados} />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GraficoAmostrasEquipamento 
                data={equipamentoMetrics || []} 
                isLoading={loadingAnalytics} 
              />
              <GraficoFluxoMensal 
                data={fluxoMensal || []} 
                isLoading={loadingAnalytics} 
              />
              <GraficoAnalisesPendentes 
                data={analisesPendentes || []} 
                isLoading={loadingAnalytics} 
              />
              <GraficoQuarentenaAnalise 
                data={statusAmostras || []} 
                isLoading={loadingAnalytics} 
              />
            </div>
          </TabsContent>

          <TabsContent value="dados" className="space-y-6">
            <FiltrosRelatorio
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filtroRapido={filtroRapido}
              setFiltroRapido={setFiltroRapido}
              dataInicio={dataInicio}
              setDataInicio={setDataInicio}
              dataFim={dataFim}
              setDataFim={setDataFim}
              onExportCSV={handleExportCSV}
            />

            {loadingRelatorio ? (
              <Skeleton className="h-96" />
            ) : (
              <TabelaRelatorio 
                dados={dadosPaginados}
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                setPaginaAtual={setPaginaAtual}
                totalRegistros={dadosExpandidos.length}
                itensPorPagina={itensPorPagina}
              />
            )}
          </TabsContent>

          <TabsContent value="dinamica" className="space-y-6">
            {loadingRelatorio ? (
              <Skeleton className="h-96" />
            ) : (
              <TabelaDinamica dados={dadosFiltrados} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
};

export default RelatorioAmostras;
