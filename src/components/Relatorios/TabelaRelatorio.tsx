
import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { PaginacaoRelatorio } from './PaginacaoRelatorio';

interface DadoExpandido {
  id: string;
  codigo: string;
  lote: string;
  nome_produto?: string | null;
  fabricante?: string | null;
  status: string | null;
  produtos?: { nome: string; fabricante: string; } | null;
  equipamentos?: { nome: string; } | null;
  tipos_estabilidade?: { nome: string; sigla: string; } | null;
  cronograma: {
    id: string;
    codigo_versao: string | null;
    tempo_coleta: string;
    data_programada: string;
    data_realizada: string | null;
    realizada: boolean | null;
  } | null;
}

interface TabelaRelatorioProps {
  dados: DadoExpandido[];
  paginaAtual: number;
  totalPaginas: number;
  setPaginaAtual: (pagina: number) => void;
  totalRegistros: number;
  itensPorPagina: number;
}

type SortField = 'codigo' | 'produto' | 'lote' | 'fabricante' | 'tipo' | 'equipamento' | 'status' | 'tempo_coleta' | 'data_programada' | 'data_realizada' | 'status_retirada';
type SortDirection = 'asc' | 'desc' | null;

const truncateCell = (text: string | null | undefined, maxLength = 18): string => {
  if (!text) return '-';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const TabelaRelatorio: React.FC<TabelaRelatorioProps> = ({ 
  dados, 
  paginaAtual, 
  totalPaginas, 
  setPaginaAtual,
  totalRegistros,
  itensPorPagina
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const getStatusIcon = (realizada: boolean | null, dataProgramada: string) => {
    if (realizada) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    const hoje = new Date();
    const dataProgram = parseISO(dataProgramada);
    
    if (dataProgram < hoje) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = (realizada: boolean | null, dataProgramada: string) => {
    if (realizada) return 'Realizada';
    
    const hoje = new Date();
    const dataProgram = parseISO(dataProgramada);
    
    if (dataProgram < hoje) return 'Atrasada';
    return 'Pendente';
  };

  const getStatusVariant = (realizada: boolean | null, dataProgramada: string) => {
    if (realizada) return 'default';
    
    const hoje = new Date();
    const dataProgram = parseISO(dataProgramada);
    
    if (dataProgram < hoje) return 'destructive';
    return 'secondary';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Aplicar ordenação aos dados já expandidos
  const dadosOrdenados = useMemo(() => {
    if (!sortField || !sortDirection) return dados;

    const sorted = [...dados].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'codigo':
          aValue = a.cronograma?.codigo_versao || a.codigo || '';
          bValue = b.cronograma?.codigo_versao || b.codigo || '';
          break;
        case 'produto':
          aValue = a.produtos?.nome || a.nome_produto || '';
          bValue = b.produtos?.nome || b.nome_produto || '';
          break;
        case 'lote':
          aValue = a.lote || '';
          bValue = b.lote || '';
          break;
        case 'fabricante':
          aValue = a.produtos?.fabricante || a.fabricante || '';
          bValue = b.produtos?.fabricante || b.fabricante || '';
          break;
        case 'tipo':
          aValue = a.tipos_estabilidade?.sigla || '';
          bValue = b.tipos_estabilidade?.sigla || '';
          break;
        case 'equipamento':
          aValue = a.equipamentos?.nome || '';
          bValue = b.equipamentos?.nome || '';
          break;
        case 'status':
          aValue = a.status || 'ativo';
          bValue = b.status || 'ativo';
          break;
        case 'tempo_coleta':
          aValue = a.cronograma?.tempo_coleta || '';
          bValue = b.cronograma?.tempo_coleta || '';
          break;
        case 'data_programada':
          aValue = a.cronograma?.data_programada || '';
          bValue = b.cronograma?.data_programada || '';
          break;
        case 'data_realizada':
          aValue = a.cronograma?.data_realizada || '';
          bValue = b.cronograma?.data_realizada || '';
          break;
        case 'status_retirada':
          if (!a.cronograma && !b.cronograma) {
            aValue = 'Sem cronograma';
            bValue = 'Sem cronograma';
          } else if (!a.cronograma) {
            aValue = 'Sem cronograma';
            bValue = getStatusText(b.cronograma?.realizada, b.cronograma?.data_programada || '');
          } else if (!b.cronograma) {
            aValue = getStatusText(a.cronograma?.realizada, a.cronograma?.data_programada || '');
            bValue = 'Sem cronograma';
          } else {
            aValue = getStatusText(a.cronograma?.realizada, a.cronograma?.data_programada || '');
            bValue = getStatusText(b.cronograma?.realizada, b.cronograma?.data_programada || '');
          }
          break;
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return sorted;
  }, [dados, sortField, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório Detalhado de Amostras e Cronogramas</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 min-w-[90px]">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('codigo')}
                    >
                      Código
                      {getSortIcon('codigo')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 min-w-[100px] hidden sm:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('produto')}
                    >
                      Produto
                      {getSortIcon('produto')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-[80px]">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('lote')}
                    >
                      Lote
                      {getSortIcon('lote')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-28 min-w-[90px] hidden md:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('fabricante')}
                    >
                      Fabricante
                      {getSortIcon('fabricante')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 min-w-[60px] hidden lg:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('tipo')}
                    >
                      Tipo
                      {getSortIcon('tipo')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-28 min-w-[90px] hidden lg:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('equipamento')}
                    >
                      Equipamento
                      {getSortIcon('equipamento')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 min-w-[70px] hidden xl:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 min-w-[70px] hidden xl:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('tempo_coleta')}
                    >
                      Tempo
                      {getSortIcon('tempo_coleta')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-[80px]">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('data_programada')}
                    >
                      Programada
                      {getSortIcon('data_programada')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-[80px] hidden md:table-cell">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('data_realizada')}
                    >
                      Realizada
                      {getSortIcon('data_realizada')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-28 min-w-[90px]">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                      onClick={() => handleSort('status_retirada')}
                    >
                      Status
                      {getSortIcon('status_retirada')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosOrdenados.map((item, index) => {
                    const codigo = item.cronograma?.codigo_versao || item.codigo;
                    const produto = item.produtos?.nome || item.nome_produto || '-';
                    const lote = item.lote || '-';
                    const fabricante = item.produtos?.fabricante || item.fabricante || '-';
                    const tipo = item.tipos_estabilidade?.sigla || '-';
                    const equipamento = item.equipamentos?.nome || '-';
                    const tempoColeta = item.cronograma?.tempo_coleta || '-';

                    return (
                      <TableRow key={`${item.id}-${item.cronograma?.id || 'sem-cronograma'}-${index}`}>
                        <TableCell className="font-medium text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(codigo, 15)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{codigo}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(produto, 15)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{produto}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(lote, 12)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{lote}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(fabricante, 15)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{fabricante}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(tipo, 8)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tipo}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(equipamento, 15)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{equipamento}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant={item.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                            {item.status === 'ativo' ? 'Ativo' : item.status || 'ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{truncateCell(tempoColeta, 10)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tempoColeta}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.cronograma ? 
                            formatDateSafe(item.cronograma.data_programada) : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {item.cronograma?.data_realizada ? 
                            formatDateSafe(item.cronograma.data_realizada) : 
                            '-'
                          }
                        </TableCell>
                         <TableCell>
                           {item.cronograma ? (
                             <div className="flex items-center gap-1">
                               {getStatusIcon(item.cronograma.realizada, item.cronograma.data_programada)}
                               <Badge 
                                 variant={getStatusVariant(item.cronograma.realizada, item.cronograma.data_programada)}
                                 className="text-xs"
                               >
                                 {getStatusText(item.cronograma.realizada, item.cronograma.data_programada)}
                               </Badge>
                             </div>
                           ) : (
                             <Badge variant="outline" className="text-xs">
                               Sem cronograma
                             </Badge>
                           )}
                         </TableCell>
                       </TableRow>
                     );
                   })
                 )}
               </TableBody>
             </Table>
           </div>
         </TooltipProvider>

         {/* Paginação */}
         <PaginacaoRelatorio
           paginaAtual={paginaAtual}
           totalPaginas={totalPaginas}
           setPaginaAtual={setPaginaAtual}
           totalRegistros={totalRegistros}
           itensPorPagina={itensPorPagina}
         />
       </CardContent>
     </Card>
   );
};
