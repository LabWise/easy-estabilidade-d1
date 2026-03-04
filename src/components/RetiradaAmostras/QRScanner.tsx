import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle, CheckCircle, Settings } from 'lucide-react';
// Dynamic import será implementado no useEffect

interface QRScannerProps {
  onCodigoDetectado: (codigo: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onCodigoDetectado }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const scannerRef = useRef<any>(null); // Tipo any para dynamic import
  const scannerElementId = "qr-reader";

  // Função para processar o resultado do QR Code
  const handleQrCodeSuccess = useCallback((decodedText: string, decodedResult: any) => {
    console.log('QR Code detectado:', decodedText);
    
    try {
      // Tentar fazer parse do JSON da etiqueta de estabilidade
      const qrData = JSON.parse(decodedText);
      console.log('Dados do QR Code (JSON):', qrData);
      
      // Verificar se é um QR code da etiqueta de estabilidade
      if (qrData.codigo && qrData.sistema === 'Easy Estabilidade') {
        const codigoVersionado = qrData.codigo;
        console.log('Código versionado detectado:', codigoVersionado);
        setLastScannedCode(codigoVersionado);
        onCodigoDetectado(codigoVersionado);
      } else {
        // Se não for JSON válido da etiqueta, usar o resultado direto
        setLastScannedCode(decodedText);
        onCodigoDetectado(decodedText);
      }
    } catch (error) {
      // Se não for JSON válido, usar o resultado direto
      console.log('QR Code não é JSON, usando resultado direto:', decodedText);
      setLastScannedCode(decodedText);
      onCodigoDetectado(decodedText);
    }
    
    // Para o scanner após detectar um código
    stopScanning();
  }, [onCodigoDetectado]);

  // Função para tratar erros (opcional)
  const handleQrCodeError = useCallback((errorMessage: string) => {
    // Não loga erros de "No QR code found" para evitar spam no console
    if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
      console.log('Erro no scan QR:', errorMessage);
    }
  }, []);

  // Carrega as câmeras disponíveis com melhor tratamento de permissões
  const loadCameras = async () => {
    try {
      // Primeiro, solicita permissão de câmera explicitamente
      console.log('Solicitando permissão de câmera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prioriza câmera traseira
        } 
      });
      
      // Para o stream imediatamente após conseguir permissão
      stream.getTracks().forEach(track => track.stop());
      console.log('Permissão de câmera concedida');
      
      // Dynamic import e carregamento das câmeras
      const Html5QrcodeModule = await import('html5-qrcode');
      const cameras = await Html5QrcodeModule.Html5Qrcode.getCameras();
      console.log('Câmeras encontradas:', cameras);
      setCameras(cameras);
      
      // Seleciona a câmera traseira por padrão (se disponível)
      const backCamera = cameras.find(camera => 
        camera.label?.toLowerCase().includes('back') || 
        camera.label?.toLowerCase().includes('rear') ||
        camera.label?.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        setSelectedCamera(backCamera.id);
        console.log('Câmera traseira selecionada:', backCamera.label);
      } else if (cameras.length > 0) {
        setSelectedCamera(cameras[0].id);
        console.log('Primeira câmera selecionada:', cameras[0].label);
      }
    } catch (err) {
      console.error('Erro ao carregar câmeras:', err);
      let errorMessage = 'Não foi possível acessar as câmeras do dispositivo.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador e recarregue a página.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Câmera está sendo usada por outro aplicativo. Feche outros apps que usam câmera e tente novamente.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Acesso à câmera bloqueado por questões de segurança. Verifique se está usando HTTPS.';
        }
      }
      
      setError(errorMessage);
    }
  };

  // Carrega câmeras quando o componente é montado
  useEffect(() => {
    loadCameras();
  }, []);

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } catch (error) {
          console.error('Erro no cleanup:', error);
        }
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      console.log('Iniciando QR scanner...');
      
      // Aguarda o DOM estar pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verifica se o elemento existe
      const element = document.getElementById(scannerElementId);
      if (!element) {
        setError('Elemento do scanner não encontrado. Tente novamente.');
        return;
      }

      // Verifica se temos câmeras
      if (cameras.length === 0) {
        console.log('Tentando recarregar câmeras...');
        await loadCameras();
        
        if (cameras.length === 0) {
          setError('Nenhuma câmera encontrada. Verifique se o dispositivo possui câmera e permita o acesso.');
          return;
        }
      }

      const cameraId = selectedCamera || cameras[0]?.id;
      if (!cameraId) {
        setError('Não foi possível selecionar uma câmera');
        return;
      }

      console.log('Usando câmera:', cameraId);

      // Para qualquer scanner existente
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          console.log('Erro ao limpar scanner anterior:', e);
        }
      }

      // Limpa o elemento antes de inicializar
      element.innerHTML = '';

      // Dynamic import e criação do scanner
      const Html5QrcodeModule = await import('html5-qrcode');
      scannerRef.current = new Html5QrcodeModule.Html5Qrcode(scannerElementId);
      
      // Configurações otimizadas do scanner
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: Math.min(qrboxSize, 300),
            height: Math.min(qrboxSize, 300)
          };
        },
        aspectRatio: 1.0,
        disableFlip: false
      };

      console.log('Iniciando scanner com config:', config);

      // Inicia o scanner
      await scannerRef.current.start(
        cameraId,
        config,
        handleQrCodeSuccess,
        handleQrCodeError
      );

      setIsScanning(true);
      setIsInitialized(true);
      console.log('Scanner QR iniciado com sucesso');
      
    } catch (err) {
      console.error('Erro ao iniciar scanner QR:', err);
      let errorMessage = 'Não foi possível acessar a câmera.';
      
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          errorMessage = 'Permissão de câmera negada. Clique no ícone da câmera na barra de endereço e permita o acesso, depois recarregue a página.';
        } else if (err.message.includes('NotFoundError')) {
          errorMessage = 'Câmera não encontrada. Verifique se há uma câmera disponível no dispositivo.';
        } else if (err.message.includes('NotReadableError')) {
          errorMessage = 'Câmera está ocupada por outro aplicativo. Feche outros apps que usam câmera e tente novamente.';
        } else if (err.message.includes('OverconstrainedError')) {
          errorMessage = 'Configuração de câmera não suportada. Tentando com configurações alternativas...';
          setTimeout(() => startScanningWithFallback(), 1000);
          return;
        }
      }
      
      setError(errorMessage);
    }
  };

  // Função fallback com configurações mais simples
  const startScanningWithFallback = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }

      const Html5QrcodeModule = await import('html5-qrcode');
      scannerRef.current = new Html5QrcodeModule.Html5Qrcode(scannerElementId);
      
      // Configurações mais simples para compatibilidade
      const fallbackConfig = {
        fps: 5,
        qrbox: { width: 200, height: 200 }
      };

      await scannerRef.current.start(
        selectedCamera || cameras[0]?.id || { facingMode: "environment" },
        fallbackConfig,
        handleQrCodeSuccess,
        handleQrCodeError
      );

      setIsScanning(true);
      setError(null);
      console.log('Scanner iniciado com configurações fallback');
    } catch (fallbackErr) {
      console.error('Erro no fallback:', fallbackErr);
      setError('Não foi possível iniciar a câmera mesmo com configurações básicas. Verifique as permissões do navegador.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        setIsInitialized(false);
        
        // Limpa o elemento
        const element = document.getElementById(scannerElementId);
        if (element) {
          element.innerHTML = '';
        }
        
        console.log('Scanner QR parado');
      } catch (error) {
        console.error('Erro ao parar scanner:', error);
        setIsScanning(false);
        setIsInitialized(false);
      }
    }
  };

  const handleManualInput = () => {
    const codigo = prompt('Digite o código da amostra:');
    if (codigo && codigo.trim()) {
      setLastScannedCode(codigo.trim());
      onCodigoDetectado(codigo.trim());
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Use a câmera para escanear o QR Code da etiqueta da amostra ou digite o código manualmente.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lastScannedCode && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Último código detectado: <strong>{lastScannedCode}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Instruções de Permissão */}
      {error && error.includes('Permissão') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como permitir acesso à câmera:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Clique no ícone de câmera 📷 na barra de endereço do navegador</li>
              <li>Selecione "Permitir" para usar a câmera</li>
              <li>Recarregue a página se necessário</li>
              <li>Em dispositivos móveis, verifique as configurações do navegador</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Seleção de Câmera */}
      {cameras.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Câmera:</label>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            disabled={isScanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Câmera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!isScanning ? (
          <Button 
            onClick={startScanning} 
            className="flex items-center gap-2"
            disabled={cameras.length === 0}
          >
            <Camera className="h-4 w-4" />
            Iniciar Câmera
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="outline" className="flex items-center gap-2">
            <CameraOff className="h-4 w-4" />
            Parar Câmera
          </Button>
        )}
        
        <Button onClick={handleManualInput} variant="outline">
          Digitar Código
        </Button>

        {cameras.length === 0 && (
          <Button onClick={loadCameras} variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Recarregar Câmeras
          </Button>
        )}
      </div>

      {/* Container do Scanner */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <div 
              id={scannerElementId}
              className="w-full max-w-md mx-auto"
              style={{ 
                minHeight: isScanning ? '350px' : '0px',
                width: '100%',
                maxWidth: '400px'
              }}
            />
            
            {!isScanning && (
              <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clique em "Iniciar Câmera" para começar</p>
                </div>
              </div>
            )}
          </div>
          
          {isScanning && (
            <div className="mt-4 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Posicione o QR Code dentro da área destacada
              </p>
              <p className="text-center text-xs text-muted-foreground">
                O scanner irá detectar automaticamente o código
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Scanner QR Code Profissional!</strong> Sistema otimizado para ler QR Codes das etiquetas de estabilidade. 
          Funciona em dispositivos móveis e desktop com excelente precisão.
        </AlertDescription>
      </Alert>
    </div>
  );
};