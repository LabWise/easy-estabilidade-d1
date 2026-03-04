
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, PrinterIcon } from 'lucide-react';
import { EtiquetaAmostra } from './EtiquetaAmostra';
import { format } from 'date-fns';
import { formatDateSafe } from '@/lib/utils';

interface CronogramaItem {
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  amostra?: any;
}

interface ModalImpressaoEtiquetasProps {
  isOpen: boolean;
  onClose: () => void;
  cronograma: CronogramaItem[];
  amostrasCriadas: any[];
}

export const ModalImpressaoEtiquetas: React.FC<ModalImpressaoEtiquetasProps> = ({
  isOpen,
  onClose,
  cronograma,
  amostrasCriadas
}) => {
  const imprimirEtiqueta = (item: CronogramaItem, index: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const etiquetaElement = document.getElementById(`etiqueta-${index}`);
    if (!etiquetaElement) return;

    const printContent = etiquetaElement.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta ${item.codigo_versao}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 5mm; }
            }
            body {
              font-family: monospace;
              font-size: 8px;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const imprimirTodas = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todasEtiquetas = cronograma.map((_, index) => {
      const element = document.getElementById(`etiqueta-${index}`);
      return element ? element.innerHTML : '';
    }).join('<div style="page-break-after: always; margin-bottom: 5mm;"></div>');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Todas as Etiquetas</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 5mm; }
            }
            body {
              font-family: monospace;
              font-size: 8px;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
          ${todasEtiquetas}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const obterDadosAmostra = (item: CronogramaItem) => {
    const amostra = item.amostra || amostrasCriadas[0] || {};
    return {
      nomeProduto: amostra.nome_produto || '',
      lote: amostra.lote || '',
      dataFabricacao: amostra.data_fabricacao || '',
      dataVencimento: amostra.data_vencimento || '',
      fabricante: amostra.fabricante || '',
      cliente: amostra.cliente || '',
      noProjeto: amostra.no_projeto_input || ''
    };
  };

  const totalAmostras = amostrasCriadas.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-6xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Etiquetas para Impressão 
              ({cronograma.length} etiquetas de {totalAmostras} amostra{totalAmostras > 1 ? 's' : ''})
            </span>
            <div className="flex gap-2">
              <Button onClick={imprimirTodas} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Todas
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="w-4 h-4" />
                Fechar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cronograma.map((item, index) => {
            const dadosAmostra = obterDadosAmostra(item);
            
            return (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{item.codigo_versao}</h3>
                    <p className="text-xs text-gray-600">
                      {item.tempo_coleta} - {formatDateSafe(item.data_programada)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => imprimirEtiqueta(item, index)}
                    size="sm"
                    variant="outline"
                  >
                    <PrinterIcon className="w-3 h-3 mr-1" />
                    Imprimir
                  </Button>
                </div>
                
                <div id={`etiqueta-${index}`} className="bg-white">
                  <EtiquetaAmostra
                    codigoVersionado={item.codigo_versao}
                    nomeProduto={dadosAmostra.nomeProduto}
                    lote={dadosAmostra.lote}
                    dataFabricacao={dadosAmostra.dataFabricacao}
                    dataVencimento={dadosAmostra.dataVencimento}
                    dataProgramada={item.data_programada}
                    tempoColeta={item.tempo_coleta}
                    fabricante={dadosAmostra.fabricante}
                    cliente={dadosAmostra.cliente}
                    noProjeto={dadosAmostra.noProjeto}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
