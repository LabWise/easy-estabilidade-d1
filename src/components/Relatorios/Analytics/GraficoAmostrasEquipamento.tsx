import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2 } from 'lucide-react';
import { EquipamentMetrics } from '@/hooks/useAnalyticsData';
import { CHART_COLORS } from "@/lib/chart-colors";
import { ModalDetalhesMetricas } from './ModalDetalhesMetricas';

interface GraficoAmostrasEquipamentoProps {
  data: EquipamentMetrics[];
  isLoading?: boolean;
}

export const GraficoAmostrasEquipamento: React.FC<GraficoAmostrasEquipamentoProps> = ({ 
  data, 
  isLoading 
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroModal, setFiltroModal] = useState<{
    tipo: 'total' | 'pre_registro' | 'pos_registro' | 'equipamentos';
    equipamentoId?: string;
    equipamentoNome?: string;
  } | null>(null);

  const handleCardClick = (tipo: 'total' | 'pre_registro' | 'pos_registro' | 'equipamentos') => {
    setFiltroModal({ tipo });
    setModalAberto(true);
  };
  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      pre_registro: 'Pré-registro',
      pos_registro: 'Pós-registro'
    };
    
    return [value, labels[name] || name];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Amostras por Equipamento
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
          <Building2 className="h-5 w-5 text-blue-600" />
          Distribuição de Amostras por Equipamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quantidade de amostras por equipamento separadas por tipo de registro
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="equipamento_nome" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    pre_registro: 'Pré-registro',
                    pos_registro: 'Pós-registro'
                  };
                  return labels[value] || value;
                }}
              />
              <Bar 
                dataKey="pre_registro" 
                fill={CHART_COLORS[0]} 
                radius={[2, 2, 0, 0]}
                name="pre_registro"
              />
              <Bar 
                dataKey="pos_registro" 
                fill={CHART_COLORS[1]} 
                radius={[2, 2, 0, 0]}
                name="pos_registro"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {data && data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div 
              className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleCardClick('total')}
            >
              <div className="font-semibold text-primary">
                {data.reduce((acc, item) => acc + item.total, 0)}
              </div>
              <div className="text-muted-foreground">Total Amostras</div>
            </div>
            <div 
              className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleCardClick('pre_registro')}
            >
              <div className="font-semibold text-green-600">
                {data.reduce((acc, item) => acc + item.pre_registro, 0)}
              </div>
              <div className="text-muted-foreground">Pré-registro</div>
            </div>
            <div 
              className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleCardClick('pos_registro')}
            >
              <div className="font-semibold text-blue-600">
                {data.reduce((acc, item) => acc + item.pos_registro, 0)}
              </div>
              <div className="text-muted-foreground">Pós-registro</div>
            </div>
            <div 
              className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleCardClick('equipamentos')}
            >
              <div className="font-semibold text-purple-600">
                {data.length}
              </div>
              <div className="text-muted-foreground">Equipamentos</div>
            </div>
          </div>
        )}

        <ModalDetalhesMetricas
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          filtro={filtroModal}
        />
      </CardContent>
    </Card>
  );
};