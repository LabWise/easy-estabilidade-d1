import React, { lazy, Suspense } from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Calendar, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useProximasRetiradas } from '../hooks/useProximasRetiradas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { truncateText, formatDateSafe } from '@/lib/utils';
// Dynamic import para XLSX sem usar lazy para bibliotecas não-React
import { PaginacaoRelatorio } from '../components/Relatorios/PaginacaoRelatorio';

const ProximasRetiradas = () => {
  const { 
    proximasRetiradas, 
    proximasRetiradasPaginadas,
    isLoading,
    paginaAtual,
    setPaginaAtual,
    totalRegistros,
    totalPaginas,
    itensPorPagina,
    sortField,
    sortDirection,
    handleSort
  } = useProximasRetiradas();

  const handleExportToExcel = async () => {
    if (!proximasRetiradas || proximasRetiradas.length === 0) {
      return;
    }

    // Dynamic import do XLSX apenas quando necessário
    const XLSXModule = await import('xlsx');
    
    const dataForExport = proximasRetiradas.map((retirada) => ({
      'Código Versão': retirada.codigo_versao,
      'Código Amostra': retirada.amostras?.codigo || '',
      'Tempo de Coleta': retirada.tempo_coleta,
      'Data Programada': formatDateSafe(retirada.data_programada),
      'Lote': retirada.amostras?.lote || '',
      'Produto': retirada.amostras?.produtos?.nome || '',
      'Tipo Estabilidade': retirada.amostras?.tipos_estabilidade?.sigla || '',
      'Status': retirada.realizada ? 'Realizada' : 'Programada'
    }));

    const wb = XLSXModule.utils.book_new();
    const ws = XLSXModule.utils.json_to_sheet(dataForExport);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // Código Versão
      { wch: 15 }, // Código Amostra
      { wch: 15 }, // Tempo de Coleta
      { wch: 15 }, // Data Programada
      { wch: 20 }, // Lote
      { wch: 30 }, // Produto
      { wch: 15 }, // Tipo Estabilidade
      { wch: 12 }  // Status
    ];
    ws['!cols'] = colWidths;

    XLSXModule.utils.book_append_sheet(wb, ws, 'Próximas Retiradas');
    
    const fileName = `proximas_retiradas_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSXModule.writeFile(wb, fileName);
  };

  const getDiasParaRetirada = (dataProgramada: string) => {
    const hoje = new Date();
    const dataRetirada = new Date(dataProgramada);
    const diffTime = dataRetirada.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (retirada: any) => {
    if (retirada.realizada) {
      return <Badge variant="secondary">Realizada</Badge>;
    }
    
    const dias = getDiasParaRetirada(retirada.data_programada);
    if (dias < 0) {
      return <Badge variant="destructive">Atrasada ({Math.abs(dias)} dias)</Badge>;
    } else if (dias <= 7) {
      return <Badge variant="default">Próxima ({dias} dias)</Badge>;
    } else {
      return <Badge variant="outline">Programada ({dias} dias)</Badge>;
    }
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <ResponsiveLayout title="Próximas Retiradas">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando próximas retiradas...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout title="Próximas Retiradas">
      <TooltipProvider>
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma de Retiradas
              </CardTitle>
              <Button 
                onClick={handleExportToExcel}
                disabled={!proximasRetiradas || proximasRetiradas.length === 0}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar XLS
              </Button>
            </CardHeader>
            <CardContent>
              {proximasRetiradas && proximasRetiradas.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('codigo_versao')}
                          >
                            <div className="flex items-center gap-2">
                              Código Versão
                              {renderSortIcon('codigo_versao')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('codigo_amostra')}
                          >
                            <div className="flex items-center gap-2">
                              Código Amostra
                              {renderSortIcon('codigo_amostra')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('tempo_coleta')}
                          >
                            <div className="flex items-center gap-2">
                              Tempo de Coleta
                              {renderSortIcon('tempo_coleta')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('data_programada')}
                          >
                            <div className="flex items-center gap-2">
                              Data Programada
                              {renderSortIcon('data_programada')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('lote')}
                          >
                            <div className="flex items-center gap-2">
                              Lote
                              {renderSortIcon('lote')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => handleSort('produto')}
                          >
                            <div className="flex items-center gap-2">
                              Produto
                              {renderSortIcon('produto')}
                            </div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proximasRetiradasPaginadas.map((retirada) => {
                          const lote = retirada.amostras?.lote || '-';
                          const produto = retirada.amostras?.produtos?.nome || '-';
                          
                          return (
                            <TableRow key={retirada.id}>
                              <TableCell className="font-medium">
                                {retirada.codigo_versao}
                              </TableCell>
                              <TableCell>
                                {retirada.amostras?.codigo || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {retirada.tempo_coleta}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDateSafe(retirada.data_programada)}
                              </TableCell>
                              <TableCell>
                                {lote.length > 25 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">{truncateText(lote, 25)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{lote}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  lote
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {produto.length > 25 ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">{truncateText(produto, 25)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{produto}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      produto
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {retirada.amostras?.tipos_estabilidade?.sigla}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(retirada)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <PaginacaoRelatorio
                    paginaAtual={paginaAtual}
                    totalPaginas={totalPaginas}
                    setPaginaAtual={setPaginaAtual}
                    totalRegistros={totalRegistros}
                    itensPorPagina={itensPorPagina}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma retirada programada</h3>
                  <p className="text-muted-foreground">
                    Não há retiradas programadas no cronograma.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </ResponsiveLayout>
  );
};

export default ProximasRetiradas;