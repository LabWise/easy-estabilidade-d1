import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnaliseDetalhada {
  id: string;
  amostra_codigo: string;
  nome_produto: string;
  tipo_analise: string;
  data_criacao: string;
  dias_pendente: number;
  status: string;
}

interface ModalAnalisesPendentesProps {
  isOpen: boolean;
  onClose: () => void;
  filtro: 'total' | 'no_prazo' | 'atencao' | 'criticas' | null;
  titulo: string;
}

export const ModalAnalisesPendentes: React.FC<ModalAnalisesPendentesProps> = ({
  isOpen,
  onClose,
  filtro,
  titulo
}) => {
  const { data: analises = [], isLoading, error } = useQuery({
    queryKey: ['analises-pendentes-detalhes', filtro],
    queryFn: async () => {
      if (!filtro) return [];

      let query = supabase
        .from('status_analises_amostras')
        .select(`
          id,
          created_at,
          status,
          amostra_id,
          tipo_analise_id,
          amostras!inner(codigo, nome_produto),
          tipos_analise!inner(descricao)
        `)
        .in('status', ['pendente', 'em_andamento']);

      // Aplicar filtros de data baseados no tipo
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split('T')[0];

      switch (filtro) {
        case 'no_prazo':
          const data10DiasAtras = new Date(hoje);
          data10DiasAtras.setDate(hoje.getDate() - 10);
          query = query.gte('created_at', data10DiasAtras.toISOString());
          break;
        
        case 'atencao':
          const data30DiasAtras = new Date(hoje);
          data30DiasAtras.setDate(hoje.getDate() - 30);
          const data21DiasAtras = new Date(hoje);
          data21DiasAtras.setDate(hoje.getDate() - 21);
          query = query
            .lte('created_at', data21DiasAtras.toISOString())
            .gte('created_at', data30DiasAtras.toISOString());
          break;
        
        case 'criticas':
          const data30DiasAtrasCriticas = new Date(hoje);
          data30DiasAtrasCriticas.setDate(hoje.getDate() - 30);
          query = query.lt('created_at', data30DiasAtrasCriticas.toISOString());
          break;
        
        // 'total' não precisa de filtro adicional de data
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;

      return data?.map((item: any) => {
        const dataCriacao = new Date(item.created_at);
        const diffTime = Math.abs(hoje.getTime() - dataCriacao.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          amostra_codigo: item.amostras.codigo,
          nome_produto: item.amostras.nome_produto,
          tipo_analise: item.tipos_analise.descricao,
          data_criacao: item.created_at,
          dias_pendente: diffDays,
          status: item.status
        };
      }) || [];
    },
    enabled: isOpen && !!filtro
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'destructive';
      case 'em_andamento': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {titulo}
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {analises.length} análises
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Erro ao carregar dados das análises
            </div>
          ) : analises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma análise encontrada para este filtro
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Amostra</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo de Análise</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Dias Pendente</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analises.map((analise) => (
                  <TableRow key={analise.id}>
                    <TableCell className="font-medium">
                      {analise.amostra_codigo}
                    </TableCell>
                    <TableCell>{analise.nome_produto}</TableCell>
                    <TableCell>{analise.tipo_analise}</TableCell>
                    <TableCell>
                      {format(new Date(analise.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        analise.dias_pendente > 30 ? 'text-red-600' :
                        analise.dias_pendente > 20 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {analise.dias_pendente} dias
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(analise.status)}>
                        {getStatusText(analise.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};