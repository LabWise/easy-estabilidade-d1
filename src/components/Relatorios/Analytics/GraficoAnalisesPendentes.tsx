import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { AnalisesPendentes } from '@/hooks/useAnalyticsData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CHART_COLORS, STATUS_COLORS } from "@/lib/chart-colors";
import { ModalAnalisesPendentes } from './ModalAnalisesPendentes';

interface GraficoAnalisesPendentesProps {
  data: AnalisesPendentes[];
  isLoading?: boolean;
}

export const GraficoAnalisesPendentes: React.FC<GraficoAnalisesPendentesProps> = ({ 
  data, 
  isLoading 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroModal, setFiltroModal] = useState<'total' | 'no_prazo' | 'atencao' | 'criticas' | null>(null);
  const [tituloModal, setTituloModal] = useState('');

  const handleCardClick = (tipo: 'total' | 'no_prazo' | 'atencao' | 'criticas', titulo: string) => {
    setFiltroModal(tipo);
    setTituloModal(titulo);
    setModalAberto(true);
  };
  const formatTooltip = (value: number, name: string) => {
    return [value, 'Quantidade de análises'];
  };

  // Cores para as barras baseadas na criticidade
  const getBarColor = (item: AnalisesPendentes) => {
    if (item.faixa_dias.includes('>30')) return STATUS_COLORS.critico;
    if (item.faixa_dias.includes('21-30')) return STATUS_COLORS.atencao;
    if (item.faixa_dias.includes('11-20')) return CHART_COLORS[1];
    return CHART_COLORS[0];
  };

  const totalPendentes = data?.reduce((acc, item) => acc + item.quantidade, 0) || 0;
  const criticas = data?.filter(item => item.critico).reduce((acc, item) => acc + item.quantidade, 0) || 0;
  const muito30dias = data?.find(item => item.faixa_dias.includes('>30'))?.quantidade || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Análises Pendentes
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
          <Clock className="h-5 w-5 text-orange-600" />
          Análises Pendentes por Tempo de Espera
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição das análises pendentes por dias de espera (prazo: 30 dias)
        </p>
      </CardHeader>
      <CardContent>
        {/* Alertas de criticidade */}
        {criticas > 0 && (
          <div className="mb-4 space-y-2">
            {muito30dias > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{muito30dias} análises</strong> estão há mais de 30 dias pendentes (prazo crítico excedido)
                </AlertDescription>
              </Alert>
            )}
            {criticas > muito30dias && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>{criticas - muito30dias} análises</strong> estão entre 21-30 dias (atenção necessária)
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="faixa_dias" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="quantidade" 
                radius={[4, 4, 0, 0]}
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div 
            className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => handleCardClick('total', 'Total de Análises Pendentes')}
          >
            <div className="font-semibold text-primary">
              {totalPendentes}
            </div>
            <div className="text-muted-foreground">Total Pendentes</div>
          </div>
          <div 
            className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => handleCardClick('no_prazo', 'Análises no Prazo (0-10 dias)')}
          >
            <div className="font-semibold text-green-600">
              {data?.find(item => item.faixa_dias.includes('0-10'))?.quantidade || 0}
            </div>
            <div className="text-muted-foreground">No Prazo</div>
          </div>
          <div 
            className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => handleCardClick('atencao', 'Análises que Precisam de Atenção (21-30 dias)')}
          >
            <div className="font-semibold text-yellow-600">
              {criticas - muito30dias}
            </div>
            <div className="text-muted-foreground">Atenção</div>
          </div>
          <div 
            className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => handleCardClick('criticas', 'Análises Críticas (>30 dias)')}
          >
            <div className="font-semibold text-red-600">
              {muito30dias}
            </div>
            <div className="text-muted-foreground">Críticas</div>
          </div>
        </div>

        <ModalAnalisesPendentes
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          filtro={filtroModal}
          titulo={tituloModal}
        />
      </CardContent>
    </Card>
  );
};