import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, PrinterIcon } from 'lucide-react';
import { EtiquetaAmostra } from './EtiquetaAmostra';
import { format } from 'date-fns';
import { escapeHTML, createSecurePrintContent, validatePrintData } from '@/lib/security';
import { formatDateSafe } from '@/lib/utils';

interface CronogramaItem {
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  amostra?: any;
}

interface SecurePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronograma: CronogramaItem[];
  amostrasCriadas: any[];
}

export const SecurePrintModal: React.FC<SecurePrintModalProps> = ({
  isOpen,
  onClose,
  cronograma,
  amostrasCriadas
}) => {
  const createSecureEtiquetaContent = (item: CronogramaItem, dadosAmostra: any) => {
    // Validar dados antes de usar
    if (!validatePrintData(item.codigo_versao) || !validatePrintData(item.tempo_coleta)) {
      console.error('Dados inválidos para impressão:', item);
      return '';
    }

    const template = `
      <div style="
        width: 80mm;
        height: 40mm;
        border: 1px solid #000;
        font-family: monospace;
        font-size: 8px;
        line-height: 1.2;
        padding: 2mm;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="font-weight: bold; margin-bottom: 2mm; text-align: center;">
          {{codigo}}
        </div>
        <div style="margin-bottom: 1mm;">
          Produto: {{produto}}
        </div>
        <div style="margin-bottom: 1mm;">
          Lote: {{lote}}
        </div>
        <div style="margin-bottom: 1mm;">
          Tempo: {{tempo}}
        </div>
        <div style="font-size: 7px;">
          Data: {{data}}
        </div>
      </div>
    `;

    return createSecurePrintContent(template, {
      codigo: item.codigo_versao,
      produto: dadosAmostra.nomeProduto || '',
      lote: dadosAmostra.lote || '',
      tempo: item.tempo_coleta,
      data: formatDateSafe(item.data_programada)
    });
  };

  const imprimirEtiqueta = (item: CronogramaItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dadosAmostra = obterDadosAmostra(item);
    const secureContent = createSecureEtiquetaContent(item, dadosAmostra);
    
    const printTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta {{codigo}}</title>
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
          {{content}}
        </body>
      </html>
    `;

    const finalContent = createSecurePrintContent(printTemplate, {
      codigo: item.codigo_versao,
      content: secureContent
    });
    
    printWindow.document.write(finalContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const imprimirTodas = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todasEtiquetas = cronograma
      .map(item => {
        const dadosAmostra = obterDadosAmostra(item);
        return createSecureEtiquetaContent(item, dadosAmostra);
      })
      .filter(Boolean)
      .join('<div style="page-break-after: always; margin-bottom: 5mm;"></div>');
    
    const printTemplate = `
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
          {{content}}
        </body>
      </html>
    `;

    const finalContent = createSecurePrintContent(printTemplate, {
      content: todasEtiquetas
    });
    
    printWindow.document.write(finalContent);
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
                    <h3 className="font-semibold text-sm">{escapeHTML(item.codigo_versao)}</h3>
                    <p className="text-xs text-gray-600">
                      {escapeHTML(item.tempo_coleta)} - {formatDateSafe(item.data_programada)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => imprimirEtiqueta(item)}
                    size="sm"
                    variant="outline"
                  >
                    <PrinterIcon className="w-3 h-3 mr-1" />
                    Imprimir
                  </Button>
                </div>
                
                <div className="bg-white">
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