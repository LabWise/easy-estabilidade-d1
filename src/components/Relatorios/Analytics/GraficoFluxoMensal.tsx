import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { FluxoMensal } from '@/hooks/useAnalyticsData';
import { CHART_COLORS } from "@/lib/chart-colors";

interface GraficoFluxoMensalProps {
  data: FluxoMensal[];
  isLoading?: boolean;
}

export const GraficoFluxoMensal: React.FC<GraficoFluxoMensalProps> = ({ 
  data, 
  isLoading 
}) => {
  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      entradas: 'Entradas',
      saidas: 'Saídas',
      taxa_ocupacao: 'Taxa de Ocupação (%)'
    };
    
    if (name === 'taxa_ocupacao') {
      return [`${value.toFixed(1)}%`, labels[name]];
    }
    
    return [value, labels[name] || name];
  };

  const calcularTendencia = () => {
    if (!data || data.length < 2) return null;
    
    // Invertendo a lógica: penúltimo mês será data[1] e último mês será data[0]
    const penultimoMes = data[1];  
    const ultimoMes = data[0];    
    
    console.log('Debug - Últimos meses:', {
      ultimoMes: {
        mes: ultimoMes.mes,
        entradas: ultimoMes.entradas,
        saidas: ultimoMes.saidas,
        taxa_ocupacao: ultimoMes.taxa_ocupacao
      },
      penultimoMes: {
        mes: penultimoMes.mes,
        entradas: penultimoMes.entradas,
        saidas: penultimoMes.saidas,
        taxa_ocupacao: penultimoMes.taxa_ocupacao
      }
    });

    const variacaoEntradas = ultimoMes.entradas - penultimoMes.entradas;
    const variacaoSaidas = ultimoMes.saidas - penultimoMes.saidas;
    const variacaoTaxa = ultimoMes.taxa_ocupacao - penultimoMes.taxa_ocupacao;
    
    return {
      entradas: variacaoEntradas,
      saidas: variacaoSaidas,
      taxa: variacaoTaxa
    };
  };

  const tendencia = calcularTendencia();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Fluxo Mensal de Amostras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparação entre entradas e saídas mensais com taxa de ocupação
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="count" tick={{ fontSize: 12 }} />
              <YAxis 
                yAxisId="percent" 
                orientation="right" 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="count"
                dataKey="entradas" 
                fill={CHART_COLORS[0]} 
                radius={[2, 2, 0, 0]}
                name="entradas"
              />
              <Bar 
                yAxisId="count"
                dataKey="saidas" 
                fill={CHART_COLORS[1]} 
                radius={[2, 2, 0, 0]}
                name="saidas"
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="taxa_ocupacao"
                stroke={CHART_COLORS[6]}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS[6], strokeWidth: 2, r: 4 }}
                name="taxa_ocupacao"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {tendencia && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-semibold">Entradas</div>
                <div className="text-muted-foreground">Variação mensal</div>
              </div>
              <div className="flex items-center gap-1">
                {tendencia.entradas >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={tendencia.entradas >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {tendencia.entradas >= 0 ? '+' : ''}{tendencia.entradas}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-semibold">Saídas</div>
                <div className="text-muted-foreground">Variação mensal</div>
              </div>
              <div className="flex items-center gap-1">
                {tendencia.saidas >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={tendencia.saidas >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {tendencia.saidas >= 0 ? '+' : ''}{tendencia.saidas}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-semibold">Taxa Ocupação</div>
                <div className="text-muted-foreground">Variação mensal</div>
              </div>
              <div className="flex items-center gap-1">
                {tendencia.taxa >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={tendencia.taxa >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {tendencia.taxa >= 0 ? '+' : ''}{tendencia.taxa.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};