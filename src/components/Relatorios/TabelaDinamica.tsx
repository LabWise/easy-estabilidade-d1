import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { TableProperties, BarChart3, LineChart as LineChartIcon, Plus, X } from 'lucide-react';
import { CHART_COLORS, getChartColor } from "@/lib/chart-colors";
import { AmostraComCronograma } from '@/hooks/useRelatorioAmostras';

interface TabelaDinamicaProps {
  dados: AmostraComCronograma[];
}

type Dimensao = 'equipamento' | 'tipo_estabilidade' | 'status' | 'tipo_registro' | 'mes_entrada' | 'fabricante';
type Metrica = 'count' | 'avg_dias_retirada' | 'percentual_realizado';
type TipoGrafico = 'table' | 'bar' | 'line' | 'pie';

interface Filtro {
  dimensao: Dimensao;
  valor: string;
}

export const TabelaDinamica: React.FC<TabelaDinamicaProps> = ({ dados }) => {
  const [dimensoesSelecionadas, setDimensoesSelecionadas] = useState<Dimensao[]>(['equipamento']);
  const [metricaSelecionada, setMetricaSelecionada] = useState<Metrica>('count');
  const [tipoVisualizacao, setTipoVisualizacao] = useState<TipoGrafico>('table');
  const [filtros, setFiltros] = useState<Filtro[]>([]);

  const dimensoesDisponiveis: { value: Dimensao; label: string }[] = [
    { value: 'equipamento', label: 'Equipamento' },
    { value: 'tipo_estabilidade', label: 'Tipo de Estabilidade' },
    { value: 'status', label: 'Status' },
    { value: 'tipo_registro', label: 'Tipo de Registro' },
    { value: 'mes_entrada', label: 'Mês de Entrada' },
    { value: 'fabricante', label: 'Fabricante' }
  ];

  const metricas: { value: Metrica; label: string }[] = [
    { value: 'count', label: 'Quantidade' },
    { value: 'avg_dias_retirada', label: 'Média de Dias para Retirada' },
    { value: 'percentual_realizado', label: 'Percentual Realizado (%)' }
  ];

  // Processar dados baseado nas dimensões e métricas selecionadas
  const dadosProcessados = useMemo(() => {
    let dadosFiltrados = dados.filter(item => {
      return filtros.every(filtro => {
        switch (filtro.dimensao) {
          case 'equipamento':
            return item.equipamentos?.nome === filtro.valor;
          case 'tipo_estabilidade':
            return item.tipos_estabilidade?.nome === filtro.valor;
          case 'status':
            return item.status === filtro.valor;
          case 'tipo_registro':
            return (item as any).tipo_registro === filtro.valor;
          case 'fabricante':
            return item.produtos?.fabricante === filtro.valor;
          case 'mes_entrada':
            const mesEntrada = new Date(item.data_entrada).toISOString().slice(0, 7);
            return mesEntrada === filtro.valor;
          default:
            return true;
        }
      });
    });

    // Expandir dados para incluir cronograma
    const dadosExpandidos = dadosFiltrados.flatMap(item => 
      item.cronograma_retiradas?.map(cronograma => ({
        ...item,
        cronograma_item: cronograma
      })) || [{ ...item, cronograma_item: null }]
    );

    // Agrupar por dimensões
    const agrupados: Record<string, any[]> = {};
    
    dadosExpandidos.forEach(item => {
      const chave = dimensoesSelecionadas.map(dim => {
        switch (dim) {
          case 'equipamento':
            return item.equipamentos?.nome || 'Sem equipamento';
          case 'tipo_estabilidade':
            return item.tipos_estabilidade?.nome || 'Sem tipo';
          case 'status':
            return item.status || 'ativo';
          case 'tipo_registro':
            return (item as any).tipo_registro || 'pre-registro';
          case 'fabricante':
            return item.produtos?.fabricante || item.fabricante || 'Sem fabricante';
          case 'mes_entrada':
            return new Date(item.data_entrada).toISOString().slice(0, 7);
          default:
            return 'N/A';
        }
      }).join(' | ');
      
      if (!agrupados[chave]) {
        agrupados[chave] = [];
      }
      agrupados[chave].push(item);
    });

    // Calcular métricas
    return Object.entries(agrupados).map(([chave, items]) => {
      const dimensaoValues = chave.split(' | ');
      const result: any = { chave };
      
      dimensoesSelecionadas.forEach((dim, index) => {
        result[dim] = dimensaoValues[index];
      });

      switch (metricaSelecionada) {
        case 'count':
          result.valor = items.length;
          break;
        case 'avg_dias_retirada':
          const comRetirada = items.filter(item => 
            item.cronograma_item?.data_realizada && item.cronograma_item?.data_programada
          );
          if (comRetirada.length > 0) {
            const somadias = comRetirada.reduce((acc, item) => {
              const programada = new Date(item.cronograma_item.data_programada);
              const realizada = new Date(item.cronograma_item.data_realizada);
              const dias = Math.floor((realizada.getTime() - programada.getTime()) / (1000 * 60 * 60 * 24));
              return acc + dias;
            }, 0);
            result.valor = Math.round(somadias / comRetirada.length);
          } else {
            result.valor = 0;
          }
          break;
        case 'percentual_realizado':
          const comCronograma = items.filter(item => item.cronograma_item);
          const realizados = comCronograma.filter(item => item.cronograma_item?.realizada);
          result.valor = comCronograma.length > 0 
            ? Math.round((realizados.length / comCronograma.length) * 100) 
            : 0;
          break;
      }

      return result;
    }).sort((a, b) => b.valor - a.valor);
  }, [dados, dimensoesSelecionadas, metricaSelecionada, filtros]);

  const valoresDisponiveis = useMemo(() => {
    const valores: Record<Dimensao, Set<string>> = {
      equipamento: new Set(),
      tipo_estabilidade: new Set(),
      status: new Set(),
      tipo_registro: new Set(),
      mes_entrada: new Set(),
      fabricante: new Set()
    };

    dados.forEach(item => {
      valores.equipamento.add(item.equipamentos?.nome || 'Sem equipamento');
      valores.tipo_estabilidade.add(item.tipos_estabilidade?.nome || 'Sem tipo');
      valores.status.add(item.status || 'ativo');
      valores.tipo_registro.add((item as any).tipo_registro || 'pre-registro');
      valores.fabricante.add(item.produtos?.fabricante || item.fabricante || 'Sem fabricante');
      valores.mes_entrada.add(new Date(item.data_entrada).toISOString().slice(0, 7));
    });

    return valores;
  }, [dados]);

  const adicionarFiltro = () => {
    setFiltros([...filtros, { dimensao: 'equipamento', valor: '' }]);
  };

  const removerFiltro = (index: number) => {
    setFiltros(filtros.filter((_, i) => i !== index));
  };

  const atualizarFiltro = (index: number, campo: 'dimensao' | 'valor', valor: string) => {
    const novosFiltros = [...filtros];
    novosFiltros[index] = { ...novosFiltros[index], [campo]: valor };
    setFiltros(novosFiltros);
  };

  const COLORS_PIE = CHART_COLORS;

  const renderVisualizacao = () => {
    if (dadosProcessados.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado disponível para as dimensões selecionadas
        </div>
      );
    }

    switch (tipoVisualizacao) {
      case 'table':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {dimensoesSelecionadas.map(dim => (
                  <TableHead key={dim}>
                    {dimensoesDisponiveis.find(d => d.value === dim)?.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">
                  {metricas.find(m => m.value === metricaSelecionada)?.label}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosProcessados.map((item, index) => (
                <TableRow key={index}>
                  {dimensoesSelecionadas.map(dim => (
                    <TableCell key={dim}>{item[dim]}</TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{item.valor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'bar':
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosProcessados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="chave" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]}>
                  <LabelList dataKey="valor" position="top" fontSize={12} fill="hsl(var(--foreground))" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

        case 'line':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dadosProcessados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="chave" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                >
                  <LabelList dataKey="valor" position="top" fontSize={12} fill="hsl(var(--foreground))" />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          );

        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dadosProcessados}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ chave, percent }) => `${chave} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="hsl(var(--primary))"
                  dataKey="valor"
                >
                  {dadosProcessados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-purple-600" />
          Tabela Dinâmica
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure suas próprias análises selecionando dimensões e métricas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Dimensões</Label>
            <Select
              value={dimensoesSelecionadas[0]}
              onValueChange={(value) => setDimensoesSelecionadas([value as Dimensao])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dimensoesDisponiveis.map(dim => (
                  <SelectItem key={dim.value} value={dim.value}>
                    {dim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Métrica</Label>
            <Select
              value={metricaSelecionada}
              onValueChange={(value) => setMetricaSelecionada(value as Metrica)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricas.map(metrica => (
                  <SelectItem key={metrica.value} value={metrica.value}>
                    {metrica.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visualização</Label>
                <Select value={tipoVisualizacao} onValueChange={(value: TipoGrafico) => setTipoVisualizacao(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                <SelectItem value="table">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Tabela
                  </div>
                </SelectItem>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Gráfico de Barras
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Gráfico de Linhas
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Gráfico de Pizza
                  </div>
                </SelectItem>
                  </SelectContent>
                </Select>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Filtros</Label>
            <Button size="sm" variant="outline" onClick={adicionarFiltro}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Filtro
            </Button>
          </div>
          
          {filtros.length > 0 && (
            <div className="space-y-2">
              {filtros.map((filtro, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={filtro.dimensao}
                    onValueChange={(value) => atualizarFiltro(index, 'dimensao', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dimensoesDisponiveis.map(dim => (
                        <SelectItem key={dim.value} value={dim.value}>
                          {dim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filtro.valor}
                    onValueChange={(value) => atualizarFiltro(index, 'valor', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um valor" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(valoresDisponiveis[filtro.dimensao]).map(valor => (
                        <SelectItem key={valor} value={valor}>
                          {valor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removerFiltro(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {filtros.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filtros.map((filtro, index) => (
                <Badge key={index} variant="secondary">
                  {dimensoesDisponiveis.find(d => d.value === filtro.dimensao)?.label}: {filtro.valor}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Visualização */}
        <div className="border rounded-lg p-4">
          {renderVisualizacao()}
        </div>
      </CardContent>
    </Card>
  );
};