
import { format } from 'date-fns';
import { CronogramaItem, AmostraComCronograma } from '@/types/gestaoAmostras';
import { escapeHTML, truncateTextSafe, createSecurePrintContent, validatePrintData } from '@/lib/security';

export const imprimirEtiquetas = (
  itensFiltrados: CronogramaItem[],
  amostra: AmostraComCronograma,
  usuarioImpressao: string
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Validar dados de entrada
  if (!validatePrintData(usuarioImpressao)) {
    console.error('Dados de usuário inválidos para impressão');
    return;
  }

  // Função para gerar QR Code como SVG com validação
  const generateQRCodeSVG = (data: string) => {
    const sanitizedData = encodeURIComponent(data);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${sanitizedData}`;
    return `<img src="${escapeHTML(qrCodeUrl)}" style="width: 50px; height: 50px;" alt="QR Code" />`;
  };

  const etiquetasHtml = itensFiltrados.map((item) => {
    // Validar dados do item
    if (!validatePrintData(item.codigo_versao) || !validatePrintData(item.tempo_coleta)) {
      console.error('Dados do item inválidos para impressão:', item);
      return '';
    }

    const qrData = JSON.stringify({
      codigo: escapeHTML(item.codigo_versao),
      produto: escapeHTML(amostra.nome_produto || amostra.produtos?.nome || ''),
      lote: escapeHTML(amostra.lote),
      tempo: escapeHTML(item.tempo_coleta),
      data_entrada: amostra.data_entrada,
      usuario: escapeHTML(usuarioImpressao),
      sistema: 'Easy Estabilidade'
    });

    const nomeProduto = escapeHTML(amostra.nome_produto || amostra.produtos?.nome || '');
    const lote = escapeHTML(amostra.lote);
    const noProjeto = amostra.no_projeto_input ? escapeHTML(amostra.no_projeto_input) : '';
    const codigoVersionado = escapeHTML(item.codigo_versao);
    const tempoColeta = escapeHTML(item.tempo_coleta);
    const dataEntrada = escapeHTML(format(new Date(amostra.data_entrada), 'dd/MM/yy'));

    // Criar seção do projeto condicionalmente
    const secaoProjeto = noProjeto ? `
            <!-- Número do Projeto -->
            <div style="
              font-size: 9px;
              font-weight: bold;
              margin-bottom: 2mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: #333;
            " title="Nº Projeto: ${escapeHTML(noProjeto)}">${escapeHTML('Nº Projeto: ')}${escapeHTML(truncateTextSafe(noProjeto, 15))}</div>
    ` : '';

    const template = `
      <div class="etiqueta-container" style="
        width: 100mm;
        height: 50mm;
        border: 1px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.2;
        padding: 3mm;
        margin-bottom: 5mm;
        page-break-inside: avoid;
        box-sizing: border-box;
        position: relative;
        display: inline-block;
        margin-right: 5mm;
        overflow: hidden;
      ">
        <!-- Header Sistema -->
        <div style="
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 2mm;
          color: #0066cc;
        ">Easy Estabilidade</div>
        
        <!-- Código da Amostra - Destaque -->
        <div style="
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          background: #f0f8ff;
          border: 1px solid #0066cc;
          margin-bottom: 3mm;
          padding: 1.5mm;
          letter-spacing: 0.5px;
          color: #0066cc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        ">{{codigo}}</div>
        
        <!-- Container principal com informações e QR Code -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: calc(100% - 20mm);
        ">
          <!-- Informações principais -->
          <div style="
            flex: 1;
            padding-right: 2mm;
            overflow: hidden;
            max-width: calc(100% - 55px);
          ">
            <!-- Nome do Produto - Com quebra de linha elegante -->
            <div style="
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 2mm;
              line-height: 1.1;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              text-overflow: ellipsis;
              min-height: 2.2em;
              max-height: 2.2em;
              word-break: break-word;
              hyphens: auto;
            " title="{{produto}}">{{produto}}</div>
            
            ${secaoProjeto}
            
            <!-- Lote - Destaque -->
            <div style="
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 2mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            " title="Lote: {{lote}}">Lote: {{lote_truncado}}</div>
            
            <!-- Informações secundárias -->
            <div style="
              font-size: 8px;
              color: #666;
              line-height: 1.1;
            ">
              <div style="margin-bottom: 1mm;">Entrada: {{data_entrada}}</div>
              <div style="margin-bottom: 1mm;">Tempo: {{tempo}}</div>
              <div style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              " title="Por: {{usuario}}">Por: {{usuario_truncado}}</div>
            </div>
          </div>

          <!-- QR Code -->
          <div style="
            flex-shrink: 0;
            width: 50px;
            height: 50px;
          ">
            {{qr_code}}
          </div>
        </div>
      </div>
    `;

    return createSecurePrintContent(template, {
      codigo: codigoVersionado,
      produto: nomeProduto,
      lote: lote,
      lote_truncado: truncateTextSafe(lote, 12),
      no_projeto: noProjeto,
      no_projeto_truncado: truncateTextSafe(noProjeto, 15),
      data_entrada: dataEntrada,
      tempo: tempoColeta,
      usuario: escapeHTML(usuarioImpressao),
      usuario_truncado: truncateTextSafe(usuarioImpressao, 20),
      qr_code: generateQRCodeSVG(qrData)
    }, ['qr_code']); // Marca qr_code como HTML seguro
  }).filter(Boolean).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiquetas ${amostra.codigo}</title>
        <style>
          @page { 
            margin: 5mm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 5mm;
            font-family: 'Courier New', monospace;
          }
          .etiqueta-container {
            display: inline-block;
            vertical-align: top;
          }
          @media print {
            .etiqueta-container {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${etiquetasHtml}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // Aguardar um pouco para as imagens carregarem antes de imprimir
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
};
