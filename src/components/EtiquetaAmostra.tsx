
import React from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EtiquetaAmostraProps {
  codigoVersionado: string;
  nomeProduto: string;
  lote: string;
  dataFabricacao: string;
  dataVencimento: string;
  dataProgramada: string;
  tempoColeta: string;
  fabricante?: string;
  cliente?: string;
  noProjeto?: string;
}

export const EtiquetaAmostra: React.FC<EtiquetaAmostraProps> = ({
  codigoVersionado,
  nomeProduto,
  lote,
  dataFabricacao,
  dataVencimento,
  dataProgramada,
  tempoColeta,
  fabricante,
  cliente,
  noProjeto
}) => {
  // Dados para o QR Code
  const qrData = JSON.stringify({
    codigo: codigoVersionado,
    produto: nomeProduto,
    lote: lote,
    tempo: tempoColeta,
    data_programada: dataProgramada
  });

  return (
    <div className="bg-white border border-gray-300 p-2 text-xs font-mono" 
         style={{ 
           width: '104mm', 
           minHeight: '40mm',
           fontSize: '8px',
           lineHeight: '1.2'
         }}>
      {/* Cabeçalho com código */}
      <div className="text-center mb-1 pb-1 border-b border-gray-200">
        <div className="text-lg font-bold">{codigoVersionado}</div>
        <div className="text-xs">Tempo: {tempoColeta}</div>
      </div>

      <div className="flex justify-between items-start">
        {/* Informações principais */}
        <div className="flex-1 pr-2">
          <div className="mb-1">
            <strong>Produto:</strong>
            <div className="break-words">{nomeProduto}</div>
          </div>

          {noProjeto && (
            <div className="mb-1">
              <strong>Nº Projeto:</strong>
              <div className="break-words">{noProjeto}</div>
            </div>
          )}
          
          <div className="mb-1">
            <strong>Lote:</strong> {lote}
          </div>

          {fabricante && (
            <div className="mb-1">
              <strong>Fabricante:</strong>
              <div className="break-words">{fabricante}</div>
            </div>
          )}

          {cliente && (
            <div className="mb-1">
              <strong>Cliente:</strong>
              <div className="break-words">{cliente}</div>
            </div>
          )}

          {dataFabricacao && (
            <div className="mb-1">
              <strong>Fab:</strong> {format(new Date(dataFabricacao), 'dd/MM/yyyy')}
            </div>
          )}
          
          {dataVencimento && (
            <div className="mb-1">
              <strong>Venc:</strong> {format(new Date(dataVencimento), 'dd/MM/yyyy')}
            </div>
          )}
          
          <div className="mb-1">
            <strong>Retirada:</strong> {format(new Date(dataProgramada), 'dd/MM/yyyy')}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex-shrink-0">
          <QRCode
            value={qrData}
            size={60}
            level="M"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};
