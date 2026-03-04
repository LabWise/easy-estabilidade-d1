
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedQrScanner } from './enhanced-qr-scanner';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (codigo: string) => void;
  title?: string;
}

export function QrScannerModal({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Escanear QR Code" 
}: QrScannerModalProps) {
  const handleScan = (codigo: string) => {
    onScan(codigo);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <EnhancedQrScanner 
          onScan={handleScan}
          onClose={onClose}
          title={title}
        />
      </DialogContent>
    </Dialog>
  );
}
