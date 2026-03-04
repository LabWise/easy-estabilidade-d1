import React, { useState, useRef, useEffect } from 'react';
import { Camera, Type, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
// Dynamic import será implementado no useEffect
import { parseQRCodeJSON, validatePrintData } from '@/lib/security';

interface EnhancedQrScannerProps {
  onScan: (codigo: string) => void;
  onClose?: () => void;
  title?: string;
}

export function EnhancedQrScanner({ 
  onScan, 
  onClose, 
  title = "Scanner QR Code" 
}: EnhancedQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<any>(null); // Tipo any para o dynamic import
  const isInitialized = useRef(false);

  const startScanning = async () => {
    if (isInitialized.current) return;
    
    setError(null);
    setIsScanning(true);

    // Aguardar o elemento estar disponível no DOM
    const checkElement = () => {
      const element = document.getElementById("enhanced-qr-scanner");
      if (!element) {
        setTimeout(checkElement, 100);
        return;
      }
      
      initializeScanner();
    };

    const initializeScanner = async () => {
      try {
        isInitialized.current = true;

        // Dynamic import do html5-qrcode
        const Html5QrcodeModule = await import('html5-qrcode');
        const { Html5QrcodeScanner } = Html5QrcodeModule;

        const scanner = new Html5QrcodeScanner(
          "enhanced-qr-scanner",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            rememberLastUsedCamera: true,
            supportedScanTypes: []
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            console.log("[Enhanced QR] Código lido:", decodedText);
            
            // Validar dados antes de processar
            if (!validatePrintData(decodedText)) {
              console.warn('Dados QR Code inválidos ou suspeitos:', decodedText);
              setError('QR Code contém dados inválidos');
              return;
            }
            
            // Usar função segura de parse JSON
            const qrData = parseQRCodeJSON(decodedText);
            if (qrData && qrData.codigo && qrData.sistema === 'Easy Estabilidade') {
              setLastScannedCode(qrData.codigo);
              onScan(qrData.codigo);
            } else {
              // Se não for JSON válido ou não for do sistema, usar texto direto
              setLastScannedCode(decodedText);
              onScan(decodedText);
            }
            
            // Parar scanner após leitura bem-sucedida
            stopScanning();
          },
          (err) => {
            // Erros de leitura contínuos são normais
            if (!err.includes('No QR code found') && !err.includes('NotFoundException')) {
              console.log('Erro Enhanced QR Scanner:', err);
            }
          }
        );

      } catch (err) {
        console.error('Erro ao inicializar scanner:', err);
        setError('Erro ao acessar a câmera. Verifique as permissões.');
        setIsScanning(false);
        isInitialized.current = false;
      }
    };

    // Iniciar verificação do elemento
    checkElement();
  };

  // Auto-iniciar scanner quando o componente for montado
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanning();
    }, 300); // Pequeno delay para garantir que o DOM esteja pronto

    return () => clearTimeout(timer);
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar scanner:', err);
      }
    }
    setIsScanning(false);
    isInitialized.current = false;
    scannerRef.current = null;
  };

  const handleManualInput = () => {
    const codigo = prompt('Digite o código da etiqueta da amostra:');
    if (codigo && codigo.trim()) {
      const cleanCode = codigo.trim();
      
      // Validar código manual
      if (!validatePrintData(cleanCode)) {
        setError('Código inserido contém caracteres inválidos');
        return;
      }
      
      setLastScannedCode(cleanCode);
      onScan(cleanCode);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Use a câmera para escanear o QR Code da etiqueta da amostra ou digite o código manualmente.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={stopScanning}
            disabled={!isScanning}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Parar Scanner
          </Button>
          <Button 
            variant="outline"
            onClick={handleManualInput}
            size="lg"
            className="flex-1"
          >
            <Type className="mr-2 h-4 w-4" />
            Digitar Código
          </Button>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {!isScanning ? (
            <div className="bg-muted rounded-lg aspect-square flex flex-col items-center justify-center p-8 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Inicializando câmera...
              </p>
            </div>
          ) : (
            <div id="enhanced-qr-scanner" className="w-full" />
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Last Scanned Code */}
        {lastScannedCode && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Último código lido:</span>
                <Badge variant="outline" className="font-mono">
                  {lastScannedCode}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            <CheckCircle2 className="inline h-3 w-3 mr-1" />
            Caso a câmera não inicie automaticamente, clique no botão acima. Posicione o QR Code na área de leitura.
          </p>
          <p className="text-xs text-muted-foreground">
            Funciona em aplicativos web com protocolo seguro (HTTPS) e permite o acesso à câmera.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}