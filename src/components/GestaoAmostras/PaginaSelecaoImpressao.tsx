
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { AmostraComCronograma } from '@/types/gestaoAmostras';
import { ControlesSelecao } from './ControlesSelecao';
import { ItemCronograma } from './ItemCronograma';
import { imprimirEtiquetas } from './PrintService';

interface PaginaSelecaoImpressaoProps {
  isOpen: boolean;
  onClose: () => void;
  amostra: AmostraComCronograma;
}

export const PaginaSelecaoImpressao: React.FC<PaginaSelecaoImpressaoProps> = ({
  isOpen,
  onClose,
  amostra
}) => {
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const usuarioImpressao = amostra.usuario_responsavel || 'Sistema';

  const handleSelecionarTodos = () => {
    if (itensSelecionados.length === amostra.cronograma.length) {
      setItensSelecionados([]);
    } else {
      setItensSelecionados(amostra.cronograma.map(item => item.id));
    }
  };

  const handleSelecionarItem = (itemId: string) => {
    setItensSelecionados(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleImprimir = () => {
    const itensFiltrados = amostra.cronograma.filter(item => 
      itensSelecionados.includes(item.id)
    );

    if (itensFiltrados.length === 0) {
      alert('Selecione pelo menos um item para impressão');
      return;
    }

    imprimirEtiquetas(itensFiltrados, amostra, usuarioImpressao);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Seleção de Etiquetas para Impressão - {amostra.codigo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ControlesSelecao
            itensSelecionados={itensSelecionados}
            totalItens={amostra.cronograma.length}
            onSelecionarTodos={handleSelecionarTodos}
            onImprimir={handleImprimir}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amostra.cronograma.map((item) => (
              <ItemCronograma
                key={item.id}
                item={item}
                amostra={amostra}
                selecionado={itensSelecionados.includes(item.id)}
                usuarioImpressao={usuarioImpressao}
                onSelecionar={handleSelecionarItem}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
