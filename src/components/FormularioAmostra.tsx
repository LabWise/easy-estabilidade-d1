
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CamposBasicos } from './CamposBasicos';
import { PreviewDatasRetirada } from './PreviewDatasRetirada';
import { SelecionarAnalises } from './SelecionarAnalises';
import { useEntradaAmostras } from '@/hooks/useEntradaAmostras';
import { amostraService } from '@/services/amostraService';
import { PaginaSelecaoImpressao } from './GestaoAmostras/PaginaSelecaoImpressao';
import { useAuth } from '@/contexts/AuthContext';

export const FormularioAmostra: React.FC = () => {
  const { user } = useAuth();
  const {
    formData,
    setFormData,
    tiposEstabilidade,
    equipamentos,
    criarAmostraMutation,
    handleReset,
    calcularDatasRetirada,
    showEtiquetas,
    setShowEtiquetas,
    converterParaAmostraComCronograma
  } = useEntradaAmostras();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas - apenas campos obrigatórios
    if (!formData.tipoEstabilidade || !formData.nomeProduto || !formData.lote || !formData.dataFabricacao) {
      toast({
        title: 'Erro de Validação',
        description: 'Preencha todos os campos obrigatórios (Tipo de Estabilidade, Nome do Produto, Lote e Data de Fabricação)',
        variant: 'destructive'
      });
      return;
    }

    // Validação adicional para produto controlado
    if (formData.produtoControlado === 'true' && (!formData.qtdControlado || !formData.unidadeControlado || !formData.tipoControlado)) {
      toast({
        title: 'Erro de Validação',
        description: 'Para produto controlado é obrigatório preencher Quantidade, Unidade e Tipo',
        variant: 'destructive'
      });
      return;
    }

    // Validação adicional para pós registro
    if (formData.tipoRegistro === 'pos-registro' && (!formData.analisesIds || formData.analisesIds.length === 0)) {
      toast({
        title: 'Erro de Validação',
        description: 'Para pós registro é obrigatório selecionar pelo menos uma análise',
        variant: 'destructive'
      });
      return;
    }

    const dadosAmostra = amostraService.prepareDadosAmostra(formData, user?.name);
    criarAmostraMutation.mutate({ 
      dadosAmostra, 
      analisesIds: formData.analisesIds,
      formData 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CamposBasicos
        formData={formData}
        setFormData={setFormData}
        tiposEstabilidade={tiposEstabilidade}
        equipamentos={equipamentos}
      />

      {formData.tipoRegistro === 'pos-registro' && (
        <SelecionarAnalises
          analisesIds={formData.analisesIds || []}
          setAnalisesIds={(ids) => setFormData(prev => ({ ...prev, analisesIds: ids }))}
        />
      )}

      <PreviewDatasRetirada datas={calcularDatasRetirada()} />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        
        <Button type="submit" disabled={criarAmostraMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {criarAmostraMutation.isPending ? 'Salvando...' : 'Salvar Amostra'}
        </Button>
      </div>

      {/* Modal de Seleção de Etiquetas */}
      {showEtiquetas && converterParaAmostraComCronograma() && (
        <PaginaSelecaoImpressao
          isOpen={showEtiquetas}
          onClose={() => setShowEtiquetas(false)}
          amostra={converterParaAmostraComCronograma()!}
        />
      )}
    </form>
  );
};
