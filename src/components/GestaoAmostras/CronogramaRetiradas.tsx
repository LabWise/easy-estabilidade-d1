
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Calendar, Clock } from 'lucide-react';
import { CronogramaItem, AmostraComCronograma } from '@/types/gestaoAmostras';
import { PaginaSelecaoImpressao } from './PaginaSelecaoImpressao';
import { formatDateSafe } from '@/lib/utils';

interface CronogramaRetiradasProps {
  amostra: AmostraComCronograma;
}

export const CronogramaRetiradas: React.FC<CronogramaRetiradasProps> = ({ amostra }) => {
  const [isSelecaoImpressaoOpen, setIsSelecaoImpressaoOpen] = useState(false);

  const getStatusBadge = (cronogramaItem: CronogramaItem) => {
    if (cronogramaItem.realizada) {
      return <Badge className="bg-green-100 text-green-800">Realizada</Badge>;
    }
    
    const dataAtual = new Date();
    const dataProgramada = new Date(cronogramaItem.data_programada);
    
    if (dataProgramada < dataAtual) {
      return <Badge className="bg-red-100 text-red-800">Atrasada</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
  };

  const abrirSelecaoImpressao = () => {
    setIsSelecaoImpressaoOpen(true);
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Cronograma de Retiradas
            </div>
            {amostra.cronograma.length > 0 && (
              <Button onClick={abrirSelecaoImpressao} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Etiquetas
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {amostra.cronograma.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum cronograma de retirada encontrado para esta amostra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {amostra.cronograma.map((cronogramaItem) => (
                <div
                  key={cronogramaItem.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Código Versão</label>
                      <p className="font-mono text-lg font-bold text-blue-600">
                        {cronogramaItem.codigo_versao}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tempo de Coleta</label>
                      <p className="font-medium">{cronogramaItem.tempo_coleta}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data Programada</label>
                      <p>{formatDateSafe(cronogramaItem.data_programada)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div>{getStatusBadge(cronogramaItem)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaginaSelecaoImpressao
        isOpen={isSelecaoImpressaoOpen}
        onClose={() => setIsSelecaoImpressaoOpen(false)}
        amostra={amostra}
      />
    </>
  );
};
