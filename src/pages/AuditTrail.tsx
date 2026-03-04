import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveLayout } from '@/components/Layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Filter, CalendarIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe, cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  empresa_id: number;
  empresa_nome?: string;
  usuario_id: string;
  usuario_nome?: string;
  acao: string;
  tabela: string;
  registro_id: string;
  dados_antes: any;
  dados_depois: any;
  created_at: string;
}

interface Filters {
  data: Date | undefined;
  usuario: string;
  acao: string;
  tabela: string;
}

const AuditTrail = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<{[key: number]: string}>({});
  const [usuarios, setUsuarios] = useState<{[key: string]: string}>({});
  const [usuariosList, setUsuariosList] = useState<Array<{id: string, nome: string}>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    data: undefined,
    usuario: '',
    acao: '',
    tabela: ''
  });
  const { toast } = useToast();
  
  const itemsPerPage = 50;

  const traduzirAcao = (acao: string): string => {
    const traducoes: {[key: string]: string} = {
      'insert': 'Inserir',
      'update': 'Atualizar', 
      'delete': 'Excluir',
      'login': 'Login'
    };
    return traducoes[acao] || acao;
  };

  const traduzirTabela = (tabela: string): string => {
    const traducoes: {[key: string]: string} = {
      'amostras': 'Amostras',
      'produtos': 'Produtos',
      'equipamentos': 'Equipamentos',
      'tipos_estabilidade': 'Tipos de Estabilidade',
      'tipos_analise': 'Tipos de Análise',
      'cronograma_retiradas': 'Cronograma de Retiradas',
      'retiradas_amostras': 'Retiradas de Amostras',
      'status_retirada_configuracoes': 'Status de Retirada',
      'configuracoes_analise': 'Configurações de Análise',
      'amostra_analises': 'Análises de Amostras',
      'status_analises_amostras': 'Status das Análises',
      'historico_status_amostras': 'Histórico de Status',
      'historico_alteracao_analises': 'Histórico de Alterações',
      'auth.users': 'Autenticação'
    };
    return traducoes[tabela] || tabela;
  };

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar os logs com LEFT JOIN explícito para usuários
      let baseQuery = supabase
        .from('logs_auditoria')
        .select(`
          *,
          usuarios:usuario_id(nome, email)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters.data) {
        const startDate = new Date(filters.data);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.data);
        endDate.setHours(23, 59, 59, 999);
        
        baseQuery = baseQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      if (filters.usuario) {
        baseQuery = baseQuery.eq('usuario_id', filters.usuario);
      }

      if (filters.acao) {
        baseQuery = baseQuery.eq('acao', filters.acao);
      }

      if (filters.tabela) {
        baseQuery = baseQuery.eq('tabela', filters.tabela);
      }

      // Aplicar paginação e ordenação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      const { data: logsData, error: logsError, count } = await baseQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (logsError) throw logsError;

      // Buscar lista de usuários para o filtro
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome')
        .order('nome');

      if (usuariosError) throw usuariosError;

      setUsuariosList(usuariosData || []);

      // Processar logs com verificação mais robusta do usuário
      const processedLogs = logsData?.map(log => {
        let usuarioNome = 'Sistema';
        
        if (log.usuario_id) {
          // Primeiro, verificar se o JOIN retornou dados
          if (log.usuarios && log.usuarios.nome) {
            usuarioNome = log.usuarios.nome;
          } else {
            // Se o JOIN falhou, buscar na lista de usuários como fallback
            const usuarioEncontrado = usuariosData.find(u => u.id === log.usuario_id);
            usuarioNome = usuarioEncontrado?.nome || `Usuário ID: ${log.usuario_id}`;
          }
        }

        return {
          ...log,
          usuario_nome: usuarioNome
        };
      }) || [];

      setLogs(processedLogs);
      setFilteredLogs(processedLogs);
      
      // Calcular total de páginas
      const total = count || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));

    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.data, filters.usuario, filters.acao, filters.tabela, toast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const clearFilters = () => {
    setFilters({
      data: undefined,
      usuario: '',
      acao: '',
      tabela: ''
    });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const exportToExcel = () => {
    const exportData = logs.map(log => ({
      'Data/Hora': new Date(log.created_at).toLocaleString('pt-BR'),
      'Usuário': log.usuario_nome,
      'Ação': traduzirAcao(log.acao),
      'Tabela': traduzirTabela(log.tabela),
      'ID do Registro': log.registro_id,
      'Dados Antes': log.dados_antes ? JSON.stringify(log.dados_antes) : 'N/A',
      'Dados Depois': log.dados_depois ? JSON.stringify(log.dados_depois) : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
    
    const fileName = `audit-trail-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    });
  };

  const getActionVariant = (acao: string) => {
    switch (acao) {
      case 'insert': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': return 'outline';
      default: return 'default';
    }
  };

  return (
    <ResponsiveLayout title="Audit Trail">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro de Data */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.data && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.data ? format(filters.data, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.data}
                      onSelect={(date) => handleFilterChange('data', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filtro de Usuário */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <Select value={filters.usuario || 'all'} onValueChange={(value) => handleFilterChange('usuario', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {usuariosList.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Ação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ação</label>
                <Select value={filters.acao || 'all'} onValueChange={(value) => handleFilterChange('acao', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="insert">Inserir</SelectItem>
                    <SelectItem value="update">Atualizar</SelectItem>
                    <SelectItem value="delete">Excluir</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Tabela */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tabela</label>
                <Select value={filters.tabela || 'all'} onValueChange={(value) => handleFilterChange('tabela', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tabelas</SelectItem>
                    <SelectItem value="amostras">Amostras</SelectItem>
                    <SelectItem value="produtos">Produtos</SelectItem>
                    <SelectItem value="equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="tipos_estabilidade">Tipos de Estabilidade</SelectItem>
                    <SelectItem value="tipos_analise">Tipos de Análise</SelectItem>
                    <SelectItem value="cronograma_retiradas">Cronograma de Retiradas</SelectItem>
                    <SelectItem value="retiradas_amostras">Retiradas de Amostras</SelectItem>
                    <SelectItem value="auth.users">Autenticação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!filters.data && !filters.usuario && !filters.acao && !filters.tabela}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Logs de Auditoria 
              {totalPages > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Página {currentPage} de {totalPages})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchAuditLogs}
                disabled={loading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={loading || logs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Data/Hora</TableHead>
                         <TableHead>Usuário</TableHead>
                         <TableHead>Ação</TableHead>
                         <TableHead>Tabela</TableHead>
                         <TableHead>ID Registro</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={5} className="text-center py-8">
                             Nenhum log encontrado
                           </TableCell>
                         </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                           <TableCell className="font-mono text-sm">
                               {new Date(log.created_at).toLocaleString('pt-BR')}
                             </TableCell>
                             <TableCell>{log.usuario_nome}</TableCell>
                             <TableCell>
                               <Badge variant={getActionVariant(log.acao)}>
                                 {traduzirAcao(log.acao)}
                               </Badge>
                             </TableCell>
                             <TableCell>{traduzirTabela(log.tabela)}</TableCell>
                             <TableCell className="font-mono text-sm">
                               {log.registro_id}
                             </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(currentPage - 1)}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}
                        
                        {/* Páginas */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNumber)}
                                isActive={currentPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(currentPage + 1)}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default AuditTrail;