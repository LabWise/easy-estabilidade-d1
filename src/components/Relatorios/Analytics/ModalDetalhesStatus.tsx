import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AmostraDetalhada {
  id: string;
  codigo: string;
  nome_produto?: string;
  data_entrada: string;
  equipamentos?: { nome: string };
}

interface ModalDetalhesStatusProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'quarentena' | 'em_analise' | 'pendente';
  titulo: string;
}

export const ModalDetalhesStatus = ({ isOpen, onClose, status, titulo }: ModalDetalhesStatusProps) => {
  const { data: amostras, isLoading } = useQuery({
    queryKey: ['detalhes-status', status],
    queryFn: async (): Promise<AmostraDetalhada[]> => {
      if (status === 'quarentena') {
        // Amostras retiradas mas sem análise iniciada
        const { data, error } = await supabase
          .from('amostras')
          .select(`
            id,
            codigo,
            nome_produto,
            data_entrada,
            equipamentos!inner(nome),
            status_analises_amostras(status)
          `)
          .eq('status', 'retirada');

        if (error) throw error;

        return data?.filter(r => 
          !r.status_analises_amostras?.length || 
          r.status_analises_amostras.every((a: any) => a.status === 'pendente')
        ) || [];
      } else {
        // Análises em andamento ou pendentes
        const { data, error } = await supabase
          .from('status_analises_amostras')
          .select(`
            amostra_id,
            amostras!inner(
              id,
              codigo,
              nome_produto,
              data_entrada,
              equipamentos(nome)
            )
          `)
          .eq('status', status === 'em_analise' ? 'em_andamento' : 'pendente');

        if (error) throw error;

        return data?.map(item => ({
          id: item.amostras.id,
          codigo: item.amostras.codigo,
          nome_produto: item.amostras.nome_produto,
          data_entrada: item.amostras.data_entrada,
          equipamentos: item.amostras.equipamentos
        })) || [];
      }
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{titulo} - Detalhes</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {amostras?.map((amostra) => (
                <div key={amostra.id} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{amostra.codigo}</h4>
                    <Badge variant="outline">
                      {amostra.equipamentos?.nome || 'Sem equipamento'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Produto:</span> {amostra.nome_produto || 'N/A'}</p>
                    <p><span className="font-medium">Data Entrada:</span> {new Date(amostra.data_entrada).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma amostra encontrada para {titulo.toLowerCase()}.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};