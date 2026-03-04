
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User } from 'lucide-react';
import { CronogramaItem, AmostraComCronograma } from '@/types/gestaoAmostras';
import { EtiquetaEstabilidade } from './EtiquetaEstabilidade';
import { formatDateSafe } from '@/lib/utils';

interface ItemCronogramaProps {
  item: CronogramaItem;
  amostra: AmostraComCronograma;
  selecionado: boolean;
  usuarioImpressao: string;
  onSelecionar: (itemId: string) => void;
}

export const ItemCronograma: React.FC<ItemCronogramaProps> = ({
  item,
  amostra,
  selecionado,
  usuarioImpressao,
  onSelecionar
}) => {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`item-${item.id}`}
              checked={selecionado}
              onCheckedChange={() => onSelecionar(item.id)}
            />
            <span className="font-mono font-bold text-blue-600">
              {item.codigo_versao}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {item.tempo_coleta}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          <div className="flex items-center text-gray-600 mb-1">
            <Calendar className="w-3 h-3 mr-1" />
            Data Programada: {formatDateSafe(item.data_programada)}
          </div>
          <div className="flex items-center text-gray-600">
            <User className="w-3 h-3 mr-1" />
            Será impresso por: {usuarioImpressao}
          </div>
        </div>
        
        {/* Preview da etiqueta */}
        <div className="mt-3 p-2 bg-gray-50 rounded border">
          <div className="text-xs text-gray-500 mb-1">Preview da Etiqueta:</div>
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <EtiquetaEstabilidade
              codigoVersionado={item.codigo_versao}
              nomeProduto={amostra.nome_produto || amostra.produtos?.nome || ''}
              lote={amostra.lote}
              dataEntrada={amostra.data_entrada}
              tempoColeta={item.tempo_coleta}
              usuarioImpressao={usuarioImpressao}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
