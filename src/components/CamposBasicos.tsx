import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { SecureTextarea } from '@/components/ui/secure-textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Check, ChevronsUpDown } from 'lucide-react';
import { FormData, TipoEstabilidade, Equipamento } from '@/types/amostra';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ProdutoControlado } from './ProdutoControlado';
import GestaoIFAs from './GestaoIFAs';
import { sanitizeInput } from '@/lib/security';

interface CamposBasicosProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  tiposEstabilidade: TipoEstabilidade[];
  equipamentos: Equipamento[];
}

export const CamposBasicos: React.FC<CamposBasicosProps> = ({
  formData,
  setFormData,
  tiposEstabilidade,
  equipamentos
}) => {
  const [sectionsOpen, setSectionsOpen] = useState({
    basicas: true,
    produto: true,
    cliente: false,
    observacoes: false
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section, isOpen }: { title: string; section: keyof typeof sectionsOpen; isOpen: boolean }) => (
    <Button
      variant="ghost"
      className="w-full justify-between p-0 h-auto font-medium text-base"
      onClick={() => toggleSection(section)}
    >
      {title}
      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Seção - Informações Básicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <SectionHeader title="Informações Básicas" section="basicas" isOpen={sectionsOpen.basicas} />
          </CardTitle>
        </CardHeader>
        <Collapsible open={sectionsOpen.basicas}>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Data de Entrada - Fixo, não editável */}
                <div className="space-y-2">
                  <Label htmlFor="dataEntrada" className="text-sm font-medium">Data de Entrada *</Label>
                  <Input 
                    id="dataEntrada" 
                    value={formData.dataEntrada ? formData.dataEntrada.split('-').reverse().join('/') : ''} 
                    readOnly 
                    className="bg-gray-100 cursor-not-allowed" 
                  />
                </div>
                
                {/* Tipo de Estabilidade - Obrigatório */}
                <div className="space-y-2">
                  <Label htmlFor="tipoEstabilidade" className="text-sm font-medium">Tipo de Estabilidade *</Label>
                  <Select 
                    value={formData.tipoEstabilidade} 
                    onValueChange={value => setFormData(prev => ({ ...prev, tipoEstabilidade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEstabilidade.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome} ({tipo.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Equipamento/Sala - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="equipamento" className="text-sm font-medium">Equipamento/Sala</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {formData.equipamentoId ? 
                          equipamentos.find(eq => eq.id === formData.equipamentoId)?.nome 
                          : "Selecione o equipamento"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar equipamento..." />
                        <CommandList>
                          <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                          <CommandGroup>
                            {equipamentos.map(equipamento => (
                              <CommandItem
                                key={equipamento.id}
                                value={`${equipamento.nome} - ${equipamento.codigo}`}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, equipamentoId: equipamento.id }));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.equipamentoId === equipamento.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {equipamento.nome} - {equipamento.codigo}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tipo de Registro - Obrigatório */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Registro *</Label>
                  <RadioGroup 
                    value={formData.tipoRegistro} 
                    onValueChange={(value: 'pre-registro' | 'pos-registro') => 
                      setFormData(prev => ({ ...prev, tipoRegistro: value }))} 
                    className="flex flex-row space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pre-registro" id="pre-registro" />
                      <Label htmlFor="pre-registro" className="text-sm">Pré Registro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pos-registro" id="pos-registro" />
                      <Label htmlFor="pos-registro" className="text-sm">Pós Registro</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amostra Extra */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amostra Extra *</Label>
                  <RadioGroup 
                    value={formData.amostraExtra} 
                    onValueChange={value => setFormData(prev => ({ ...prev, amostraExtra: value }))} 
                    className="flex flex-row space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="nao" />
                      <Label htmlFor="nao" className="text-sm">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="sim" />
                      <Label htmlFor="sim" className="text-sm">Sim</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Produto Controlado */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Produto Controlado *</Label>
                  <RadioGroup 
                    value={formData.produtoControlado} 
                    onValueChange={value => setFormData(prev => ({ ...prev, produtoControlado: value }))} 
                    className="flex flex-row space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="produtoControlado-nao" />
                      <Label htmlFor="produtoControlado-nao" className="text-sm">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="produtoControlado-sim" />
                      <Label htmlFor="produtoControlado-sim" className="text-sm">Sim</Label>
                    </div>
                  </RadioGroup>
                </div>

                

              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Informações de Produto Controlado */}
      <ProdutoControlado
        formData={formData}
        setFormData={setFormData}
      />

      {/* Seção - Informações do Produto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <SectionHeader title="Informações do Produto" section="produto" isOpen={sectionsOpen.produto} />
          </CardTitle>
        </CardHeader>
        <Collapsible open={sectionsOpen.produto}>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Nome do Produto - Obrigatório */}
                <div className="space-y-2">
                  <Label htmlFor="nomeProduto" className="text-sm font-medium">Nome do Produto *</Label>
                  <SecureInput 
                    id="nomeProduto" 
                    value={formData.nomeProduto} 
                    onChange={value => setFormData(prev => ({ ...prev, nomeProduto: value }))} 
                    placeholder="Digite o nome do produto" 
                    className="focus:ring-2 focus:ring-blue-500"
                    fieldName="Nome do Produto"
                    maxLength={200}
                    required={true}
                  />
                </div>
                {/* Número do Projeto */}
                <div className="space-y-2">
                  <Label htmlFor="noProjeto" className="text-sm font-medium">Número do Projeto</Label>
                  <SecureInput 
                    id="noProjeto" 
                    value={formData.noProjeto} 
                    onChange={value => setFormData(prev => ({ ...prev, noProjeto: value }))} 
                    placeholder="Digite o número do projeto"
                    fieldName="Número do Projeto"
                    maxLength={100}
                  />
                </div>
                
                {/* Lote e Tamanho do Lote */}
                <div className="space-y-2">
                  <Label htmlFor="lote" className="text-sm font-medium">Lote do Produto *</Label>
                  <SecureInput 
                    id="lote" 
                    value={formData.lote} 
                    onChange={value => setFormData(prev => ({ ...prev, lote: value }))} 
                    placeholder="Digite o lote" 
                    className="focus:ring-2 focus:ring-blue-500"
                    fieldName="Lote"
                    maxLength={100}
                    required={true}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tamanhoLote" className="text-sm font-medium">Tamanho do Lote</Label>
                  <SecureInput 
                    id="tamanhoLote" 
                    value={formData.tamanhoLote} 
                    onChange={value => setFormData(prev => ({ ...prev, tamanhoLote: value }))} 
                    placeholder="Digite o tamanho do lote"
                    fieldName="Tamanho do Lote"
                    maxLength={100}
                  />
                </div>

                {/* Data de Fabricação - Obrigatório */}
                <div className="space-y-2">
                  <Label htmlFor="dataFabricacao" className="text-sm font-medium">Data de Fabricação *</Label>
                  <DatePicker 
                    date={formData.dataFabricacao} 
                    onDateChange={date => setFormData(prev => ({ ...prev, dataFabricacao: date }))} 
                    placeholder="Selecione a data de fabricação" 
                  />
                </div>

                {/* Data de Validade - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento" className="text-sm font-medium">Data de Validade</Label>
                  <DatePicker 
                    date={formData.dataVencimento} 
                    onDateChange={date => setFormData(prev => ({ ...prev, dataVencimento: date }))} 
                    placeholder="Selecione a data de validade" 
                  />
                </div>

                {/* Fabricante */}
                <div className="space-y-2">
                  <Label htmlFor="fabricante" className="text-sm font-medium">Fabricante do Produto</Label>
                  <SecureInput 
                    id="fabricante" 
                    value={formData.fabricante} 
                    onChange={value => setFormData(prev => ({ ...prev, fabricante: value }))} 
                    placeholder="Digite o fabricante"
                    fieldName="Fabricante"
                    maxLength={200}
                  />
                </div>

                {/* Concentração */}
                <div className="space-y-2">
                    <Label htmlFor="concentracaoProduto" className="text-sm font-medium">Concentração</Label>
                    <SecureInput 
                      id="concentracaoProduto" 
                      value={formData.concentracaoProduto} 
                      onChange={value => setFormData(prev => ({ ...prev, concentracaoProduto: value }))} 
                      placeholder="Ex: 500mg"
                      fieldName="Concentração"
                      maxLength={100}
                    />
                  </div>
         
                {/* Material de Acondicionamento */}
                <div className="space-y-2">
                  <Label htmlFor="materialAcondicionamento" className="text-sm font-medium">Material de Acondicionamento</Label>
                  <SecureInput 
                    id="materialAcondicionamento" 
                    value={formData.materialAcondicionamento} 
                    onChange={value => setFormData(prev => ({ ...prev, materialAcondicionamento: value }))} 
                    placeholder="Digite o material de acondicionamento"
                    fieldName="Material de Acondicionamento"
                    maxLength={200}
                  />
                </div>

                {/* Metodologia/Revisão */}
                <div className="space-y-2">
                  <Label htmlFor="metodologiaRevisao" className="text-sm font-medium">Metodologia/Revisão</Label>
                  <SecureInput 
                    id="metodologiaRevisao" 
                    value={formData.metodologiaRevisao} 
                    onChange={value => setFormData(prev => ({ ...prev, metodologiaRevisao: value }))} 
                    placeholder="Digite a metodologia/revisão"
                    fieldName="Metodologia/Revisão"
                    maxLength={200}
                  />
                </div>

                {/* Endereço do Fabricante */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="enderecoFabricante" className="text-sm font-medium">Endereço do Fabricante</Label>
                  <SecureInput 
                    id="enderecoFabricante" 
                    value={formData.enderecoFabricante} 
                    onChange={value => setFormData(prev => ({ ...prev, enderecoFabricante: value }))} 
                    placeholder="Digite o endereço do fabricante"
                    fieldName="Endereço do Fabricante"
                    maxLength={500}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção - Informações do Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <SectionHeader title="Informações do Cliente" section="cliente" isOpen={sectionsOpen.cliente} />
          </CardTitle>
        </CardHeader>
        <Collapsible open={sectionsOpen.cliente}>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="cliente" className="text-sm font-medium">Cliente</Label>
                  <SecureInput 
                    id="cliente" 
                    value={formData.cliente} 
                    onChange={value => setFormData(prev => ({ ...prev, cliente: value }))} 
                    placeholder="Digite o cliente"
                    fieldName="Cliente"
                    maxLength={200}
                  />
                </div>

                {/* Número do Pedido - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="numeroPedido" className="text-sm font-medium">Número do Pedido</Label>
                  <SecureInput 
                    id="numeroPedido" 
                    value={formData.numeroPedido} 
                    onChange={value => setFormData(prev => ({ ...prev, numeroPedido: value }))} 
                    placeholder="Digite o número do pedido"
                    fieldName="Número do Pedido"
                    maxLength={100}
                  />
                </div>

                {/* Data do Pedido - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="dataPedido" className="text-sm font-medium">Data do Pedido</Label>
                  <DatePicker 
                    date={formData.dataPedido} 
                    onDateChange={date => setFormData(prev => ({ ...prev, dataPedido: date }))} 
                    placeholder="Selecione a data do pedido" 
                  />
                </div>


                {/* Número da Proposta - Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="numeroProposta" className="text-sm font-medium">Número da Proposta</Label>
                  <SecureInput 
                    id="numeroProposta" 
                    value={formData.numeroProposta} 
                    onChange={value => setFormData(prev => ({ ...prev, numeroProposta: value }))} 
                    placeholder="Digite o número da proposta"
                    fieldName="Número da Proposta"
                    maxLength={100}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção - Dados IFA */}
      <GestaoIFAs 
        ifasLocais={formData.ifasLocais}
        onIFAsChange={(ifasLocais) => setFormData(prev => ({ ...prev, ifasLocais }))}
      />

      {/* Seção - Observações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <SectionHeader title="Observações" section="observacoes" isOpen={sectionsOpen.observacoes} />
          </CardTitle>
        </CardHeader>
        <Collapsible open={sectionsOpen.observacoes}>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivoAnalise" className="text-sm font-medium">Motivo da Análise</Label>
                <SecureTextarea 
                  id="motivoAnalise" 
                  value={formData.motivoAnalise} 
                  onChange={value => setFormData(prev => ({ ...prev, motivoAnalise: value }))} 
                  placeholder="Descreva o motivo da análise" 
                  rows={3} 
                  className="resize-none"
                  fieldName="Motivo da Análise"
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
