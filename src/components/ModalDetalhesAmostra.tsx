
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Building2, Calendar, FileText, User, Thermometer, Droplets, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AmostraComCronograma } from '@/types/gestaoAmostras';
import { CronogramaRetiradas } from '@/components/GestaoAmostras/CronogramaRetiradas';

interface ModalDetalhesAmostraProps {
  isOpen: boolean;
  onClose: () => void;
  amostra: AmostraComCronograma | null;
}

export const ModalDetalhesAmostra: React.FC<ModalDetalhesAmostraProps> = ({
  isOpen,
  onClose,
  amostra
}) => {
  if (!amostra) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-6xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Detalhes da Amostra - {amostra.codigo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Informações do Produto */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-blue-600">
                  <Package className="w-5 h-5 mr-2" />
                  Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Código da Amostra</label>
                  <p className="font-mono text-xl font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded">
                    {amostra.codigo}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome do Produto</label>
                  <p className="font-medium text-gray-900 break-words" title={amostra.nome_produto || amostra.produtos?.nome || 'N/A'}>
                    {(amostra.nome_produto || amostra.produtos?.nome || 'N/A').length > 40 
                      ? `${(amostra.nome_produto || amostra.produtos?.nome || 'N/A').substring(0, 40)}...`
                      : amostra.nome_produto || amostra.produtos?.nome || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Lote</label>
                  <p className="font-medium break-words" title={amostra.lote}>
                    {amostra.lote.length > 20 ? `${amostra.lote.substring(0, 20)}...` : amostra.lote}
                  </p>
                </div>

                {amostra.no_projeto_input && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número do Projeto</label>
                    <p className="font-medium break-words" title={amostra.no_projeto_input}>
                      {amostra.no_projeto_input.length > 25 ? `${amostra.no_projeto_input.substring(0, 25)}...` : amostra.no_projeto_input}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge 
                      className={
                        amostra.status === 'ativo' ? 'bg-green-100 text-green-800 px-3 py-1' : 
                        amostra.status === 'concluido' ? 'bg-blue-100 text-blue-800 px-3 py-1' :
                        'bg-gray-100 text-gray-800 px-3 py-1'
                      }
                    >
                      {amostra.status || 'ativo'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Amostra Extra</label>
                  <div className="mt-1">
                    <Badge variant={amostra.amostra_extra ? 'default' : 'secondary'} className="px-3 py-1">
                      {amostra.amostra_extra ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Produto Controlado</label>
                  <div className="mt-1">
                    <Badge variant={amostra.produto_controlado ? 'default' : 'secondary'} className="px-3 py-1">
                      {amostra.produto_controlado ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Comerciais */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-green-600">
                  <Building2 className="w-5 h-5 mr-2" />
                  Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fabricante</label>
                  <p className="text-gray-900">{amostra.fabricante || amostra.produtos?.fabricante || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Cliente</label>
                  <p className="text-gray-900">{amostra.cliente || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Número do Pedido</label>
                  <p className="text-gray-900 break-words" title={amostra.numero_pedido || 'N/A'}>
                    {(amostra.numero_pedido || 'N/A').length > 25 
                      ? `${(amostra.numero_pedido || 'N/A').substring(0, 25)}...`
                      : amostra.numero_pedido || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Número do Projeto (Sistema)</label>
                  <p className="text-gray-900 break-words" title={amostra.numero_projeto || 'N/A'}>
                    {(amostra.numero_projeto || 'N/A').length > 25 
                      ? `${(amostra.numero_projeto || 'N/A').substring(0, 25)}...`
                      : amostra.numero_projeto || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Número da Proposta</label>
                  <p className="text-gray-900 break-words" title={amostra.numero_proposta || 'N/A'}>
                    {(amostra.numero_proposta || 'N/A').length > 25 
                      ? `${(amostra.numero_proposta || 'N/A').substring(0, 25)}...`
                      : amostra.numero_proposta || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Datas e Informações Técnicas */}
            <Card className="col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-purple-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  Datas & Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div>
                   <label className="text-sm font-medium text-gray-600">Data de Entrada</label>
                   <p className="text-gray-900">
                     {format(new Date(amostra.data_entrada + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                   </p>
                 </div>

                 <div>
                   <label className="text-sm font-medium text-gray-600">Data de Fabricação</label>
                   <p className="text-gray-900">
                     {amostra.data_fabricacao ? format(new Date(amostra.data_fabricacao + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                   </p>
                 </div>

                 <div>
                   <label className="text-sm font-medium text-gray-600">Data de Validade</label>
                   <p className="text-gray-900">
                     {amostra.data_vencimento ? format(new Date(amostra.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                   </p>
                 </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Estabilidade</label>
                  <p className="text-gray-900">{amostra.tipos_estabilidade?.nome || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Equipamento</label>
                  <p className="text-gray-900">{amostra.equipamentos?.nome || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-orange-600">
                  <FileText className="w-5 h-5 mr-2" />
                  Condições & Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center">
                      <Thermometer className="w-4 h-4 mr-1" />
                      Temperatura
                    </label>
                    <p className="text-gray-900">
                      {amostra.temperatura !== null && amostra.temperatura !== undefined
                        ? `${amostra.temperatura} °C`
                        : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center">
                      <Droplets className="w-4 h-4 mr-1" />
                      Umidade
                    </label>
                    <p className="text-gray-900">
                      {amostra.umidade !== null && amostra.umidade !== undefined
                        ? `${amostra.umidade}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Motivo da Análise</label>
                  <p className="text-gray-900 break-words" title={amostra.motivo_analise || 'N/A'}>
                    {(amostra.motivo_analise || 'N/A').length > 50 
                      ? `${(amostra.motivo_analise || 'N/A').substring(0, 50)}...`
                      : amostra.motivo_analise || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Quantidades</label>
                  <div className="flex space-x-4 text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Inicial: {amostra.quantidade_inicial}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Atual: {amostra.quantidade_atual}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-teal-600">
                  <User className="w-5 h-5 mr-2" />
                  Responsável & Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Usuário Responsável</label>
                  <p className="text-gray-900">{amostra.usuario_responsavel || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-[60px]">
                    <p className="text-gray-900 text-sm">
                      {amostra.observacoes || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Controle - só aparece se for produto controlado */}
          {amostra.produto_controlado && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-amber-600">
                  <Shield className="w-5 h-5 mr-2" />
                  Informações de Controle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantidade</label>
                    <p className="text-gray-900">{amostra.qtd_controlado || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Unidade</label>
                    <p className="text-gray-900">{amostra.unidades?.unidade || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <p className="text-gray-900">{amostra.produtos_controlados?.nome || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cronograma de Retiradas */}
          <CronogramaRetiradas amostra={amostra} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
