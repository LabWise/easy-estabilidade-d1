
import React from 'react';
import { Label } from '@/components/ui/label';
import { formatDateSafe } from '@/lib/utils';

interface PreviewDatasRetiradaProps {
  datas: { periodo: string; data: Date; codigoVersionado: string }[];
}

export const PreviewDatasRetirada: React.FC<PreviewDatasRetiradaProps> = ({
  datas
}) => {
  console.log('PreviewDatasRetirada recebeu:', datas);
  
  if (datas.length === 0) {
    console.log('Nenhuma data para exibir');
    return null;
  }

  return (
    <div>
      <Label>Datas de Retirada Automáticas</Label>
      <div className="mt-2 p-4 bg-blue-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {datas.map((item, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-blue-600 mb-1">{item.codigoVersionado}</div>
              <div className="text-xs text-gray-600 mb-1">Tempo: {item.periodo}</div>
              <div className="text-xs text-gray-700">
                Data: {formatDateSafe(item.data.toISOString())}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
