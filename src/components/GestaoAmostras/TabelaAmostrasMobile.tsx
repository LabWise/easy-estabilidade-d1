import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Settings, Eye, FlaskConical, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Amostra } from '@/types/gestaoAmostras';
import { truncateText } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface TabelaAmostrasMobileProps {
  amostras: Amostra[];
  onRowClick: (amostra: Amostra) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, novoStatus: string) => void;
  onGestaoAnalises: (amostra: Amostra) => void;
  isStatusChanging: boolean;
}

export const TabelaAmostrasMobile: React.FC<TabelaAmostrasMobileProps> = ({
  amostras,
  onRowClick,
  onView,
  onEdit,
  onStatusChange,
  onGestaoAnalises,
  isStatusChanging
}) => {
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
    <div className="space-y-4">
      {amostras.map((amostra) => (
        <Card 
          key={amostra.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onRowClick(amostra)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header - Código e Status */}
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-lg text-primary">
                  {amostra.codigo}
                </div>
                <Badge className={getStatusBadgeStyle(amostra.status || 'ativo')}>
                  {getStatusLabel(amostra.status || 'ativo')}
                </Badge>
              </div>

              {/* Produto e Lote */}
              <div className="space-y-1">
                <div className="font-medium text-base" title={amostra.nome_produto || amostra.produtos?.nome || 'N/A'}>
                  {truncateText(amostra.nome_produto || amostra.produtos?.nome || 'N/A', 30)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Lote:</span> {truncateText(amostra.lote, 25)}
                </div>
              </div>

              {/* Informações secundárias */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Fabricante:</span>
                  <div className="text-muted-foreground" title={amostra.fabricante || amostra.produtos?.fabricante || 'N/A'}>
                    {truncateText(amostra.fabricante || amostra.produtos?.fabricante || 'N/A', 15)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <div className="text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {amostra.tipos_estabilidade?.sigla || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Data e Retiradas */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Data Entrada:</span>
                  <div className="text-muted-foreground">
                    {format(new Date(amostra.data_entrada + 'T00:00:00'), 'dd/MM/yyyy')}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Retiradas:</span>
                  <div className="text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {amostra.versoes_retiradas || 0}/{amostra.total_versoes || 0}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={amostra.amostra_extra ? 'default' : 'secondary'} className="text-xs">
                  {amostra.amostra_extra ? 'Extra' : 'Normal'}
                </Badge>
                {amostra.produto_controlado && (
                  <Badge variant="destructive" className="text-xs">
                    Controlado
                  </Badge>
                )}
              </div>

              {/* Ações */}
              <div 
                className="flex items-center justify-between pt-2 border-t" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onView(amostra.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEdit(amostra.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onGestaoAnalises(amostra)}
                    className="h-8 w-8 p-0"
                  >
                    <FlaskConical className="w-4 h-4" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={isStatusChanging}
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};