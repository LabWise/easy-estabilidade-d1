import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { StatusAmostras } from '@/hooks/useAnalyticsData';
import { Clock, FlaskConical, Pause } from 'lucide-react';
import { useState } from 'react';
import { ModalDetalhesStatus } from './ModalDetalhesStatus';
import { STATUS_COLORS } from "@/lib/chart-colors";

interface GraficoQuarentenaAnaliseProps {
  data: StatusAmostras[];
  isLoading?: boolean;
}

const COLORS = {
  'Quarentena': STATUS_COLORS.quarentena,
  'Em Análise': STATUS_COLORS.analise, 
  'Pendente': STATUS_COLORS.pendente
};

export const GraficoQuarentenaAnalise = ({ data, isLoading }: GraficoQuarentenaAnaliseProps) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [statusSelecionado, setStatusSelecionado] = useState<'quarentena' | 'em_analise' | 'pendente'>('quarentena');
  const [tituloModal, setTituloModal] = useState('');

  const totalAmostras = data?.reduce((sum, item) => sum + item.quantidade, 0) || 0;

  const handleStatusClick = (status: string) => {
    let statusKey: 'quarentena' | 'em_analise' | 'pendente';
    
    switch (status) {
      case 'Quarentena':
        statusKey = 'quarentena';
        break;
      case 'Em Análise':
        statusKey = 'em_analise';
        break;
      case 'Pendente':
        statusKey = 'pendente';
        break;
      default:
        return;
    }
    
    setStatusSelecionado(statusKey);
    setTituloModal(status);
    setModalAberto(true);
  };

  const formatTooltip = (value: number, name: string) => {
    const item = data?.find(d => d.status === name);
    return [
      `${value} amostras (${item?.percentual.toFixed(1)}%)`,
      name
    ];
  };

  const renderCustomLabel = (entry: any) => {
    if (entry.value === 0) return null;
    return `${entry.value}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5" />
            Status das Amostras
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
          <Pause className="h-5 w-5 text-orange-600" />
          Status das Amostras Retiradas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição entre amostras em quarentena e em análise
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
                nameKey="status"
              >
                {data?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status as keyof typeof COLORS] || 'hsl(var(--muted))'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend 
                formatter={(value, entry) => {
                  const item = data?.find(d => d.status === value);
                  return `${value} (${item?.percentual.toFixed(1)}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo dos Status */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {data?.map((item) => {
            const Icon = item.status === 'Quarentena' ? Pause : 
                        item.status === 'Em Análise' ? FlaskConical : Clock;
            
            return (
              <div 
                key={item.status} 
                className="text-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleStatusClick(item.status)}
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 mr-2" style={{ color: COLORS[item.status as keyof typeof COLORS] }} />
                  <span className="font-medium text-sm">{item.status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS[item.status as keyof typeof COLORS] }}>
                  {item.quantidade}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.percentual.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        
        {totalAmostras > 0 && (
          <div className="mt-4 text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-sm text-muted-foreground">Total de Amostras Processadas</div>
            <div className="text-2xl font-bold text-primary">{totalAmostras}</div>
          </div>
        )}
      </CardContent>
      
      <ModalDetalhesStatus
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        status={statusSelecionado}
        titulo={tituloModal}
      />
    </Card>
  );
};