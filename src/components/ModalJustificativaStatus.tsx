import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface ModalJustificativaStatusProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificativa: string) => void;
  statusAtual: string;
  novoStatus: string;
  codigoAmostra: string;
  isLoading?: boolean;
}

export const ModalJustificativaStatus: React.FC<ModalJustificativaStatusProps> = ({
  isOpen,
  onClose,
  onConfirm,
  statusAtual,
  novoStatus,
  codigoAmostra,
  isLoading = false
}) => {
  const [justificativa, setJustificativa] = useState('');

  const handleConfirm = () => {
    if (justificativa.trim()) {
      onConfirm(justificativa.trim());
      setJustificativa('');
    }
  };

  const handleClose = () => {
    setJustificativa('');
    onClose();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-orange-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Alteração de Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Amostra:</strong> {codigoAmostra}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Alteração:</strong> {getStatusLabel(statusAtual)} → {getStatusLabel(novoStatus)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa para alteração <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Digite a justificativa para esta alteração de status..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              Mínimo de 3 caracteres
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!justificativa.trim() || justificativa.trim().length < 3 || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Confirmar Alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};