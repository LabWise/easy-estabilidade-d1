import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salvarIFAsAmostra } from '@/services/amostraService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AmostraComCronograma } from '@/types/gestaoAmostras';
import { IFALocal } from '@/types/amostra';
import { useAuth } from '@/hooks/useAuth';
import GestaoIFAs from '@/components/GestaoIFAs';

interface FormularioEdicaoAmostraProps {
  amostra: AmostraComCronograma | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (amostraId: string, dadosAtualizados: any) => void;
  isSaving: boolean;
}

export const FormularioEdicaoAmostra: React.FC<FormularioEdicaoAmostraProps> = ({
  amostra,
  isOpen,
  onClose,
  onSave,
  isSaving
}) => {
  const { user } = useAuth();
  const isAdmin = user?.profile_type === 'administrador';

  // Estados para seções colapsáveis
  const [informacoesBasicasOpen, setInformacoesBasicasOpen] = useState(true);
  const [informacoesProdutoOpen, setInformacoesProdutoOpen] = useState(false);
  const [informacoesControladoOpen, setInformacoesControladoOpen] = useState(false);
  const [dadosIFAOpen, setDadosIFAOpen] = useState(false);
  const [outrasInformacoesOpen, setOutrasInformacoesOpen] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    lote: '',
    nome_produto: '',
    fabricante: '',
    cliente: '',
    numero_pedido: '',
    numero_projeto: '',
    numero_proposta: '',
    data_entrada: '',
    data_fabricacao: '',
    data_vencimento: '',
    data_pedido: '',
    quantidade_inicial: 0,
    quantidade_atual: 0,
    temperatura: '',
    umidade: '',
    motivo_analise: '',
    observacoes: '',
    usuario_responsavel: '',
    amostra_extra: false,
    produto_controlado: false,
    qtd_controlado: '',
    un_controlado: '',
    tipo_controlado: '',
    equipamento_id: '',
    tipo_estabilidade_id: '',
    no_projeto_input: '',
    // Novos campos
    tamanho_lote: '',
    concentracao_produto: '',
    material_acondicionamento: '',
    metodologia_revisao: '',
    endereco_fabricante: ''
  });

  const [ifasLocais, setIfasLocais] = useState<IFALocal[]>([]);

  // Query para buscar produtos controlados
  const { data: produtosControlados } = useQuery({
    queryKey: ['produtos-controlados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Query para buscar unidades
  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, unidade')
        .order('unidade');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Query para buscar equipamentos
  const { data: equipamentos } = useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome, codigo')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Query para buscar tipos de estabilidade
  const { data: tiposEstabilidade } = useQuery({
    queryKey: ['tipos-estabilidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_estabilidade')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Query para buscar IFAs da amostra
  const { data: ifasAmostra, refetch: refetchIFAs } = useQuery({
    queryKey: ['ifas-amostra', amostra?.id],
    queryFn: async () => {
      if (!amostra?.id) return [];
      
      const { data, error } = await supabase
        .from('amostra_ifas')
        .select(`
          ifa_id,
          ifa!inner(
            id,
            ifa,
            fabricante,
            lote,
            data_fabricacao,
            data_validade,
            numero_cas,
            dcb,
            endereco_fabricante
          )
        `)
        .eq('amostra_id', amostra.id);
      
      if (error) {
        console.error('Erro ao buscar IFAs da amostra:', error);
        throw error;
      }
      
      console.log('IFAs retornados da query:', data);
      
      // Função helper para converter strings de data para Date objects
      const convertToDate = (dateString: string | null): Date | null => {
        if (!dateString) return null;
        try {
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? null : date;
        } catch (error) {
          console.warn('Erro ao converter data:', dateString, error);
          return null;
        }
      };
      
      return data?.map((item, index) => ({
        id: `ifa-${item.ifa_id || index + 1}`, // Usar ifa_id real quando possível
        ifa: (item as any).ifa?.ifa || '',
        fabricante: (item as any).ifa?.fabricante || '',
        lote: (item as any).ifa?.lote || '',
        data_fabricacao: convertToDate((item as any).ifa?.data_fabricacao),
        data_validade: convertToDate((item as any).ifa?.data_validade),
        numero_cas: (item as any).ifa?.numero_cas || '',
        dcb: (item as any).ifa?.dcb || '',
        endereco_fabricante: (item as any).ifa?.endereco_fabricante || ''
      })) || [];
    },
    enabled: isOpen && !!amostra?.id
  });

  // Atualizar formData quando amostra mudar
  useEffect(() => {
    if (amostra) {
      setFormData({
        codigo: amostra.codigo || '',
        lote: amostra.lote || '',
        nome_produto: amostra.nome_produto || '',
        fabricante: amostra.fabricante || '',
        cliente: amostra.cliente || '',
        numero_pedido: amostra.numero_pedido || '',
        numero_projeto: amostra.numero_projeto || '',
        numero_proposta: amostra.numero_proposta || '',
        data_entrada: amostra.data_entrada ? amostra.data_entrada.split('T')[0] : '',
        data_fabricacao: amostra.data_fabricacao ? amostra.data_fabricacao.split('T')[0] : '',
        data_vencimento: amostra.data_vencimento ? amostra.data_vencimento.split('T')[0] : '',
        data_pedido: amostra.data_pedido ? amostra.data_pedido.split('T')[0] : '',
        quantidade_inicial: amostra.quantidade_inicial || 0,
        quantidade_atual: amostra.quantidade_atual || 0,
        temperatura: amostra.temperatura?.toString() || '',
        umidade: amostra.umidade?.toString() || '',
        motivo_analise: amostra.motivo_analise || '',
        observacoes: amostra.observacoes || '',
        usuario_responsavel: amostra.usuario_responsavel || '',
        amostra_extra: amostra.amostra_extra || false,
        produto_controlado: amostra.produto_controlado || false,
        qtd_controlado: amostra.qtd_controlado?.toString() || '',
        un_controlado: amostra.un_controlado?.toString() || '',
        tipo_controlado: amostra.tipo_controlado || '',
        equipamento_id: amostra.equipamentos?.id || '',
        tipo_estabilidade_id: amostra.tipo_estabilidade_id || '',
        no_projeto_input: amostra.no_projeto_input || '',
        // Novos campos
        tamanho_lote: (amostra as any).tamanho_lote || '',
        concentracao_produto: (amostra as any).concentracao_produto || '',
        material_acondicionamento: (amostra as any).material_acondicionamento || '',
        metodologia_revisao: (amostra as any).metodologia_revisao || '',
        endereco_fabricante: (amostra as any).endereco_fabricante || ''
      });
    }
  }, [amostra]);

  // Atualizar IFAs quando dados carregarem
  useEffect(() => {
    console.log('useEffect ifasAmostra executado:', { ifasAmostra, length: ifasAmostra?.length });
    if (ifasAmostra && ifasAmostra.length > 0) {
      console.log('IFAs encontrados, setando ifasLocais:', ifasAmostra);
      setIfasLocais(ifasAmostra as IFALocal[]);
    } else {
      console.log('Nenhum IFA encontrado, limpando ifasLocais');
      setIfasLocais([]);
    }
  }, [ifasAmostra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amostra) return;

    // Validação de produto controlado
    if (formData.produto_controlado) {
      if (!formData.qtd_controlado || !formData.un_controlado || !formData.tipo_controlado) {
        alert('Para produtos controlados, é obrigatório preencher Quantidade, Unidade e Tipo.');
        return;
      }
    }
    
    const dadosFormatados = {
      ...formData,
      quantidade_inicial: Number(formData.quantidade_inicial),
      quantidade_atual: Number(formData.quantidade_atual),
      temperatura: formData.temperatura ? Number(formData.temperatura) : null,
      umidade: formData.umidade ? Number(formData.umidade) : null,
      qtd_controlado: formData.qtd_controlado ? Number(formData.qtd_controlado) : null,
      un_controlado: formData.un_controlado ? Number(formData.un_controlado) : null,
      data_fabricacao: formData.data_fabricacao || null,
      data_vencimento: formData.data_vencimento || null,
      data_pedido: formData.data_pedido || null,
      // Converter strings vazias para null em campos UUID
      equipamento_id: formData.equipamento_id && formData.equipamento_id !== '' ? formData.equipamento_id : null,
      tipo_controlado: formData.tipo_controlado && formData.tipo_controlado !== '' ? formData.tipo_controlado : null,
      tipo_estabilidade_id: formData.tipo_estabilidade_id && formData.tipo_estabilidade_id !== '' ? formData.tipo_estabilidade_id : null
    };
    
    try {
      // Salvar dados da amostra
      await onSave(amostra.id, dadosFormatados);
      
      // Salvar IFAs
      await salvarIFAsAmostra(amostra.id, ifasLocais);
      
      // Refetch IFAs para atualizar a lista
      await refetchIFAs();
      
    } catch (error) {
      console.error('Erro ao salvar amostra e IFAs:', error);
      throw error;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Se desmarcar produto controlado, limpar campos relacionados
      if (field === 'produto_controlado' && !value) {
        newData.qtd_controlado = '';
        newData.un_controlado = '';
        newData.tipo_controlado = '';
        // Fechar a seção automaticamente
        setInformacoesControladoOpen(false);
      }
      
      // Se marcar produto controlado, abrir a seção automaticamente
      if (field === 'produto_controlado' && value) {
        setInformacoesControladoOpen(true);
      }
      
      return newData;
    });
  };

  const handleIFAsChange = (ifas: IFALocal[]) => {
    setIfasLocais(ifas);
  };

  const renderCollapsibleSection = (
    title: string,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    children: React.ReactNode
  ) => (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <span className="font-medium">{title}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 p-4 border rounded-lg">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Amostra - {amostra?.codigo}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          {renderCollapsibleSection(
            'Informações Básicas',
            informacoesBasicasOpen,
            setInformacoesBasicasOpen,
            <div className="space-y-4">
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="produto_controlado"
                    checked={formData.produto_controlado}
                    onCheckedChange={(checked) => handleInputChange('produto_controlado', checked)}
                  />
                  <Label htmlFor="produto_controlado">Produto Controlado</Label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="lote">Lote</Label>
                  <Input
                    id="lote"
                    value={formData.lote}
                    onChange={(e) => handleInputChange('lote', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tamanho_lote">Tamanho do Lote</Label>
                  <Input
                    id="tamanho_lote"
                    value={formData.tamanho_lote}
                    onChange={(e) => handleInputChange('tamanho_lote', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="data_entrada">Data de Entrada</Label>
                  <Input
                    id="data_entrada"
                    type="date"
                    value={formData.data_entrada}
                    onChange={(e) => handleInputChange('data_entrada', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="data_fabricacao">Data de Fabricação</Label>
                  <Input
                    id="data_fabricacao"
                    type="date"
                    value={formData.data_fabricacao}
                    onChange={(e) => handleInputChange('data_fabricacao', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="nome_produto">Nome do Produto</Label>
                  <Input
                    id="nome_produto"
                    value={formData.nome_produto}
                    onChange={(e) => handleInputChange('nome_produto', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Input
                    id="fabricante"
                    value={formData.fabricante}
                    onChange={(e) => handleInputChange('fabricante', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Informações do Produto */}
          {renderCollapsibleSection(
            'Informações do Produto',
            informacoesProdutoOpen,
            setInformacoesProdutoOpen,
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="concentracao_produto">Concentração</Label>
                <Input
                  id="concentracao_produto"
                  value={formData.concentracao_produto}
                  onChange={(e) => handleInputChange('concentracao_produto', e.target.value)}
                  placeholder="Ex: 500mg/mL"
                />
              </div>

              <div>
                <Label htmlFor="material_acondicionamento">Material de Acondicionamento</Label>
                <Textarea
                  id="material_acondicionamento"
                  value={formData.material_acondicionamento}
                  onChange={(e) => handleInputChange('material_acondicionamento', e.target.value)}
                  placeholder="Descreva o material de acondicionamento..."
                />
              </div>

              <div>
                <Label htmlFor="metodologia_revisao">Metodologia/Revisão</Label>
                <Textarea
                  id="metodologia_revisao"
                  value={formData.metodologia_revisao}
                  onChange={(e) => handleInputChange('metodologia_revisao', e.target.value)}
                  placeholder="Descreva a metodologia e revisão..."
                />
              </div>

              <div>
                <Label htmlFor="endereco_fabricante">Endereço do Fabricante</Label>
                <Textarea
                  id="endereco_fabricante"
                  value={formData.endereco_fabricante}
                  onChange={(e) => handleInputChange('endereco_fabricante', e.target.value)}
                  placeholder="Endereço completo do fabricante..."
                />
              </div>
            </div>
          )}

          {/* Informações de Produto Controlado */}
          {formData.produto_controlado && isAdmin && renderCollapsibleSection(
            'Informações de Produto Controlado',
            informacoesControladoOpen,
            setInformacoesControladoOpen,
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="qtd_controlado">
                  Quantidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qtd_controlado"
                  type="number"
                  step="0.01"
                  value={formData.qtd_controlado}
                  onChange={(e) => handleInputChange('qtd_controlado', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="un_controlado">
                  Unidade <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.un_controlado}
                  onValueChange={(value) => handleInputChange('un_controlado', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades?.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id.toString()}>
                        {unidade.unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo_controlado">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tipo_controlado}
                  onValueChange={(value) => handleInputChange('tipo_controlado', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosControlados?.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Dados IFA */}
          {renderCollapsibleSection(
            'Dados IFA',
            dadosIFAOpen,
            setDadosIFAOpen,
              <GestaoIFAs 
                ifasLocais={ifasLocais} 
                onIFAsChange={handleIFAsChange}
                modoEdicao="edicao"
              />
          )}

          {/* Outras Informações */}
          {renderCollapsibleSection(
            'Outras Informações',
            outrasInformacoesOpen,
            setOutrasInformacoesOpen,
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantidade_inicial">Quantidade Inicial</Label>
                  <Input
                    id="quantidade_inicial"
                    type="number"
                    value={formData.quantidade_inicial}
                    onChange={(e) => handleInputChange('quantidade_inicial', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="quantidade_atual">Quantidade Atual</Label>
                  <Input
                    id="quantidade_atual"
                    type="number"
                    value={formData.quantidade_atual}
                    onChange={(e) => handleInputChange('quantidade_atual', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="temperatura">Temperatura (°C)</Label>
                  <Input
                    id="temperatura"
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) => handleInputChange('temperatura', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="umidade">Umidade (%)</Label>
                  <Input
                    id="umidade"
                    type="number"
                    step="0.1"
                    value={formData.umidade}
                    onChange={(e) => handleInputChange('umidade', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="equipamento_id">Equipamento</Label>
                  <Select
                    value={formData.equipamento_id}
                    onValueChange={(value) => handleInputChange('equipamento_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipamentos?.map((equipamento) => (
                        <SelectItem key={equipamento.id} value={equipamento.id}>
                          {equipamento.nome} - {equipamento.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo_estabilidade_id">Tipo de Estabilidade</Label>
                  <Select
                    value={formData.tipo_estabilidade_id}
                    onValueChange={(value) => handleInputChange('tipo_estabilidade_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEstabilidade?.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome} ({tipo.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="numero_pedido">Número do Pedido</Label>
                  <Input
                    id="numero_pedido"
                    value={formData.numero_pedido}
                    onChange={(e) => handleInputChange('numero_pedido', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="numero_proposta">Número da Proposta</Label>
                  <Input
                    id="numero_proposta"
                    value={formData.numero_proposta}
                    onChange={(e) => handleInputChange('numero_proposta', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="no_projeto_input">Número do Projeto</Label>
                  <Input
                    id="no_projeto_input"
                    value={formData.no_projeto_input}
                    onChange={(e) => handleInputChange('no_projeto_input', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="motivo_analise">Motivo da Análise</Label>
                  <Textarea
                    id="motivo_analise"
                    value={formData.motivo_analise}
                    onChange={(e) => handleInputChange('motivo_analise', e.target.value)}
                    placeholder="Descreva o motivo da análise..."
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações sobre a amostra..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};