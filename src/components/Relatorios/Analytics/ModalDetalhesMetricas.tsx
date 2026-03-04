import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AmostraDetalhada {
  id: string;
  codigo: string;
  nome_produto: string;
  data_entrada: string;
  equipamento_nome?: string;
  tipo_registro: string;
  status: string;
}

interface ModalDetalhesMetricasProps {
  isOpen: boolean;
  onClose: () => void;
  filtro: {
    tipo: 'total' | 'pre_registro' | 'pos_registro' | 'equipamentos';
    equipamentoId?: string;
    equipamentoNome?: string;
  } | null;
}

export const ModalDetalhesMetricas: React.FC<ModalDetalhesMetricasProps> = ({
  isOpen,
  onClose,
  filtro
}) => {
  const { data: amostras, isLoading, error } = useQuery({
    queryKey: ['modal-detalhes-metricas', filtro],
    queryFn: async (): Promise<AmostraDetalhada[]> => {
      if (!filtro) return [];

      let query = supabase
        .from('amostras')
        .select(`
          id,
          codigo,
          nome_produto,
          data_entrada,
          tipo_registro,
          status,
          equipamentos(nome)
        `);

      // Aplicar filtros baseados no tipo
      switch (filtro.tipo) {
        case 'pre_registro':
          query = query.eq('tipo_registro', 'pre-registro');
          break;
        case 'pos_registro':
          query = query.eq('tipo_registro', 'pos-registro');
          break;
        case 'equipamentos':
          if (filtro.equipamentoId) {
            query = query.eq('equipamento_id', filtro.equipamentoId);
          }
          break;
        // 'total' não aplica filtro adicional
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        codigo: item.codigo,
        nome_produto: item.nome_produto,
        data_entrada: item.data_entrada,
        equipamento_nome: item.equipamentos?.nome,
        tipo_registro: item.tipo_registro,
        status: item.status
      })) || [];
    },
    enabled: isOpen && !!filtro
  });

  const getTituloModal = () => {
    if (!filtro) return 'Detalhes';
    
    switch (filtro.tipo) {
      case 'total':
        return 'Todas as Amostras';
      case 'pre_registro':
        return 'Amostras Pré-registro';
      case 'pos_registro':
        return 'Amostras Pós-registro';
      case 'equipamentos':
        return `Equipamentos (${filtro.equipamentoNome || 'Total'})`;
      default:
        return 'Detalhes';
    }
  };

  const formatTipoRegistro = (tipo: string) => {
    return tipo === 'pre-registro' ? 'Pré-registro' : 'Pós-registro';
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'registrada': 'Registrada',
      'retirada': 'Retirada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTituloModal()}</DialogTitle>
          {amostras && (
            <p className="text-sm text-muted-foreground">
              {amostras.length} amostra(s) encontrada(s)
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar detalhes das amostras. Tente novamente.
              </AlertDescription>
            </Alert>
          )}

          {amostras && !isLoading && !error && (
            <>
              {amostras.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma amostra encontrada para este filtro.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Data Entrada</TableHead>
                      <TableHead>Tipo Registro</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {amostras.map((amostra) => (
                      <TableRow key={amostra.id}>
                        <TableCell className="font-mono text-sm">
                          {amostra.codigo}
                        </TableCell>
                        <TableCell>{amostra.nome_produto}</TableCell>
                        <TableCell>
                          {format(new Date(amostra.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            amostra.tipo_registro === 'pre-registro' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {formatTipoRegistro(amostra.tipo_registro)}
                          </span>
                        </TableCell>
                        <TableCell>{amostra.equipamento_nome || '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            amostra.status === 'registrada' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : amostra.status === 'retirada'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : amostra.status === 'concluida'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {formatStatus(amostra.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};