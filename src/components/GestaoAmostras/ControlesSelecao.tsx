
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ControlesSelecaoProps {
  itensSelecionados: string[];
  totalItens: number;
  onSelecionarTodos: () => void;
  onImprimir: () => void;
}

export const ControlesSelecao: React.FC<ControlesSelecaoProps> = ({
  itensSelecionados,
  totalItens,
  onSelecionarTodos,
  onImprimir
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600">
        {itensSelecionados.length} de {totalItens} itens selecionados
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onSelecionarTodos}
          variant="outline"
          size="sm"
        >
          {itensSelecionados.length === totalItens ? 'Desmarcar Todos' : 'Selecionar Todos'}
        </Button>
        <Button 
          onClick={onImprimir}
          disabled={itensSelecionados.length === 0}
          size="sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Selecionados
        </Button>
      </div>
    </div>
  );
};
