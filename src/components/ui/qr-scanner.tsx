
import React, { useEffect, useRef } from 'react';
// Dynamic import será implementado no useEffect
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface QrScannerProps {
  onScan: (codigo: string) => void;
  onClose?: () => void;
  fps?: number;
  qrboxSize?: { width: number; height: number };
  className?: string;
}

export function QrScanner({ 
  onScan, 
  onClose, 
  fps = 10, 
  qrboxSize = { width: 250, height: 250 },
  className = ""
}: QrScannerProps) {
  const scannerRef = useRef<any>(null); // Tipo any para dynamic import
  const isScanning = useRef(false);

  useEffect(() => {
    const initScanner = async () => {
      if (isScanning.current) return;

      // Dynamic import do html5-qrcode
      const Html5QrcodeModule = await import('html5-qrcode');
      const { Html5QrcodeScanner } = Html5QrcodeModule;

      const scanner = new Html5QrcodeScanner(
        "qr-scanner", 
        {
          fps,
          qrbox: qrboxSize,
          aspectRatio: 1.0,
          disableFlip: false,
          rememberLastUsedCamera: true,
          supportedScanTypes: []
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;
      isScanning.current = true;

      scanner.render(
        (decodedText) => {
          console.log("[QR] Código lido:", decodedText);
          
          try {
            // Tentar fazer parse do JSON se for uma etiqueta estruturada
            const qrData = JSON.parse(decodedText);
            if (qrData.codigo && qrData.sistema === 'Easy Estabilidade') {
              onScan(qrData.codigo);
            } else {
              onScan(decodedText);
            }
          } catch {
            // Se não ser JSON, usar o texto direto
            onScan(decodedText);
          }
          
          // Limpar scanner após leitura bem-sucedida
          scanner.clear().then(() => {
            isScanning.current = false;
            onClose?.();
          });
        },
        (err) => {
          // Erros de leitura contínuos são normais, não loggar
          if (!err.includes('No QR code found') && !err.includes('NotFoundException')) {
            console.log('Erro QR Scanner:', err);
          }
        }
      );
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => 
          console.error("Erro ao limpar scanner", e)
        );
        isScanning.current = false;
      }
    };
  }, [onScan, onClose, fps, qrboxSize]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <h3 className="font-medium">Scanner QR Code</h3>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div id="qr-scanner" className="w-full" />
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Posicione o QR Code dentro da área destacada
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
