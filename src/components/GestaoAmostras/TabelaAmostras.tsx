import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Settings, Eye, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { Amostra } from '@/types/gestaoAmostras';
import { truncateText } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { TabelaAmostrasMobile } from './TabelaAmostrasMobile';

interface TabelaAmostrasProps {
  amostras: Amostra[];
  onRowClick: (amostra: Amostra) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, novoStatus: string) => void;
  onGestaoAnalises: (amostra: Amostra) => void;
  isStatusChanging: boolean;
}

export const TabelaAmostras: React.FC<TabelaAmostrasProps> = ({
  amostras,
  onRowClick,
  onView,
  onEdit,
  onStatusChange,
  onGestaoAnalises,
  isStatusChanging
}) => {
  const isMobile = useIsMobile();

  // Use versão mobile se estiver em dispositivo móvel
  if (isMobile) {
    return (
      <TabelaAmostrasMobile
        amostras={amostras}
        onRowClick={onRowClick}
        onView={onView}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        onGestaoAnalises={onGestaoAnalises}
        isStatusChanging={isStatusChanging}
      />
    );
  }
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'finalizado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Ativo';
    }
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Fabricante</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Entrada</TableHead>
            <TableHead>Retirada</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Extra</TableHead>
            <TableHead>Controlado</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {amostras.map((amostra) => (
            <TableRow 
              key={amostra.id}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onRowClick(amostra)}
            >
              <TableCell className="font-mono">{amostra.codigo}</TableCell>
              <TableCell className="font-medium" title={amostra.produtos?.nome || 'N/A'}>
                {truncateText(amostra.produtos?.nome || 'N/A', 20)}
              </TableCell>
              <TableCell title={amostra.lote}>{truncateText(amostra.lote, 20)}</TableCell>
              <TableCell title={amostra.produtos?.fabricante || 'N/A'}>
                {truncateText(amostra.produtos?.fabricante || 'N/A', 20)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{amostra.tipos_estabilidade?.sigla || 'N/A'}</Badge>
              </TableCell>
              <TableCell>{format(new Date(amostra.data_entrada + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-mono text-center">
                <Badge variant="secondary">
                  {amostra.versoes_retiradas || 0}/{amostra.total_versoes || 0}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeStyle(amostra.status || 'ativo')}>
                  {getStatusLabel(amostra.status || 'ativo')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={amostra.amostra_extra ? 'default' : 'secondary'}>
                  {amostra.amostra_extra ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={amostra.produto_controlado ? 'default' : 'secondary'}>
                  {amostra.produto_controlado ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onView(amostra.id)}
                    title="Visualizar detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEdit(amostra.id)}
                    title="Editar amostra"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onGestaoAnalises(amostra)}
                    title={amostra.tipo_registro === 'pre-registro' ? 'Adicionar análises' : 'Editar análises'}
                  >
                    <FlaskConical className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={isStatusChanging}
                        title="Alterar status"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(amostra.id, 'ativo')}
                        disabled={amostra.status === 'ativo'}
                      >
                        Ativo
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(amostra.id, 'cancelado')}
                        disabled={amostra.status === 'cancelado'}
                      >
                        Cancelado
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(amostra.id, 'finalizado')}
                        disabled={amostra.status === 'finalizado'}
                      >
                        Finalizado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
