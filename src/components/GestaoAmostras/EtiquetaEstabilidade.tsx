
import React from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';

interface EtiquetaEstabilidadeProps {
  codigoVersionado: string;
  nomeProduto: string;
  lote: string;
  dataEntrada: string;
  tempoColeta: string;
  usuarioImpressao: string;
}

export const EtiquetaEstabilidade: React.FC<EtiquetaEstabilidadeProps> = ({
  codigoVersionado,
  nomeProduto,
  lote,
  dataEntrada,
  tempoColeta,
  usuarioImpressao
}) => {
  // Dados para o QR Code
  const qrData = JSON.stringify({
    codigo: codigoVersionado,
    produto: nomeProduto,
    lote: lote,
    tempo: tempoColeta,
    data_entrada: dataEntrada,
    usuario: usuarioImpressao,
    sistema: 'Easy Estabilidade'
  });

  // Função para truncar texto longo
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="bg-white border border-gray-400 font-mono overflow-hidden"
      style={{ 
        width: '100mm', // 10cm
        height: '50mm', // 5cm
        fontSize: '12px',
        lineHeight: '1.2',
        padding: '3mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Sistema */}
      <div className="text-blue-600 font-bold mb-2" style={{ fontSize: '10px' }}>
        Easy Estabilidade
      </div>
      
      {/* Código da Amostra - Destaque Principal */}
      <div 
        className="bg-blue-50 border border-blue-300 text-center font-bold text-blue-800 rounded-sm mb-3"
        style={{ 
          fontSize: '16px', 
          padding: '1.5mm',
          letterSpacing: '0.5px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {codigoVersionado}
      </div>
      
      {/* Container principal com informações e QR Code */}
      <div className="flex justify-between items-start" style={{ height: 'calc(100% - 20mm)' }}>
        {/* Informações principais */}
        <div className="flex-1 pr-2 overflow-hidden" style={{ maxWidth: 'calc(100% - 55px)' }}>
          {/* Nome do Produto - Com quebra de linha elegante */}
          <div 
            className="font-bold mb-2 leading-tight"
            style={{ 
              fontSize: '11px',
              lineHeight: '1.1',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
              minHeight: '2.2em',
              maxHeight: '2.2em',
              wordBreak: 'break-word',
              hyphens: 'auto'
            }}
            title={nomeProduto}
          >
            {nomeProduto}
          </div>
          
          {/* Lote - Destaque */}
          <div 
            className="font-bold mb-2"
            style={{ 
              fontSize: '11px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={`Lote: ${lote}`}
          >
            Lote: {truncateText(lote, 12)}
          </div>
          
          {/* Informações secundárias */}
          <div 
            className="text-gray-600 space-y-1"
            style={{ 
              fontSize: '8px',
              lineHeight: '1.1'
            }}
          >
            <div>Entrada: {format(new Date(dataEntrada), 'dd/MM/yy')}</div>
            <div>Tempo: {tempoColeta}</div>
            <div 
              style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={`Por: ${usuarioImpressao}`}
            >
              Por: {truncateText(usuarioImpressao, 20)}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex-shrink-0" style={{ width: '50px', height: '50px' }}>
          <QRCode
            value={qrData}
            size={50}
            level="M"
            style={{ height: "50px", width: "50px" }}
          />
        </div>
      </div>
    </div>
  );
};
