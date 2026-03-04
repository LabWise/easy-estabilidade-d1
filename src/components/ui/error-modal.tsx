import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Atenção!",
  message
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <DialogTitle className="text-xl font-semibold text-center">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-center text-base leading-relaxed pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 px-8"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};