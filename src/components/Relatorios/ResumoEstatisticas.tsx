import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, BarChart3, TrendingUp, Package, Zap } from 'lucide-react';
import { AmostraComCronograma } from '@/hooks/useRelatorioAmostras';
import { parseISO } from 'date-fns';

interface ResumoEstatisticasProps {
  dados: AmostraComCronograma[];
}

export const ResumoEstatisticas: React.FC<ResumoEstatisticasProps> = ({ dados }) => {
  // Calcular estatísticas
  const totalAmostras = dados.length;
  
  const cronogramas = dados.flatMap(amostra => amostra.cronograma_retiradas);
  const totalCronogramas = cronogramas.length;
  
  const cronogramasRealizados = cronogramas.filter(c => c.realizada).length;
  const cronogramasPendentes = cronogramas.filter(c => !c.realizada && parseISO(c.data_programada) >= new Date()).length;
  const cronogramasAtrasados = cronogramas.filter(c => !c.realizada && parseISO(c.data_programada) < new Date()).length;

  const amostrasAtivas = dados.filter(a => a.status === 'ativo' || !a.status).length;
  const amostrasCanceladas = dados.filter(a => a.status === 'cancelado').length;
  const amostrasFinalizadas = dados.filter(a => a.status === 'finalizado').length;

  // Próximas retiradas (próximos 7 dias)
  const proximasRetiradas = cronogramas.filter(c => {
    if (c.realizada) return false;
    const dataProg = parseISO(c.data_programada);
    const hoje = new Date();
    const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dataProg >= hoje && dataProg <= seteDias;
  }).length;

  // Calcular porcentagens
  const percentualRealizado = totalCronogramas > 0 ? Math.round((cronogramasRealizados / totalCronogramas) * 100) : 0;
  const percentualAtrasado = totalCronogramas > 0 ? Math.round((cronogramasAtrasados / totalCronogramas) * 100) : 0;

  const estatisticasCards = [
    {
      titulo: 'Amostras Totais',
      valor: totalAmostras,
      icon: Package,
      gradiente: 'bg-gradient-to-br from-blue-500 to-blue-600',
      sombra: 'shadow-blue-500/25',
      badge: null
    },
    {
      titulo: 'Retiradas Programadas',
      valor: totalCronogramas,
      icon: BarChart3,
      gradiente: 'bg-gradient-to-br from-purple-500 to-purple-600',
      sombra: 'shadow-purple-500/25',
      badge: null
    },
    {
      titulo: 'Retiradas Realizadas',
      valor: cronogramasRealizados,
      icon: CheckCircle,
      gradiente: 'bg-gradient-to-br from-green-500 to-green-600',
      sombra: 'shadow-green-500/25',
      badge: `${percentualRealizado}%`
    },
    {
      titulo: 'Retiradas Pendentes',
      valor: cronogramasPendentes,
      icon: Clock,
      gradiente: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      sombra: 'shadow-yellow-500/25',
      badge: null
    },
    {
      titulo: 'Retiradas Atrasadas',
      valor: cronogramasAtrasados,
      icon: AlertCircle,
      gradiente: 'bg-gradient-to-br from-red-500 to-red-600',
      sombra: 'shadow-red-500/25',
      badge: `${percentualAtrasado}%`
    },
    {
      titulo: 'Próximos 7 dias',
      valor: proximasRetiradas,
      icon: Zap,
      gradiente: 'bg-gradient-to-br from-orange-500 to-orange-600',
      sombra: 'shadow-orange-500/25',
      badge: proximasRetiradas > 0 ? 'Urgente' : null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards principais de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {estatisticasCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${stat.sombra}`}
          >
            <div className={`absolute inset-0 ${stat.gradiente} opacity-90`} />
            <CardContent className="relative p-4 text-white">
              <div className="flex items-start justify-between mb-3">
                <stat.icon className="h-8 w-8 text-white/90" />
                {stat.badge && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-none">
                  {stat.valor.toLocaleString()}
                </p>
                <p className="text-sm text-white/80 font-medium">
                  {stat.titulo}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Card detalhado de status das amostras */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Status Detalhado das Amostras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Amostras Ativas</p>
                <p className="text-2xl font-bold text-green-600">{amostrasAtivas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Amostras Finalizadas</p>
                <p className="text-2xl font-bold text-blue-600">{amostrasFinalizadas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Amostras Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{amostrasCanceladas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          {/* Barra de progresso das retiradas */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso das Retiradas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{percentualRealizado}% concluído</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentualRealizado}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>{cronogramasRealizados} realizadas</span>
              <span>{cronogramasPendentes + cronogramasAtrasados} pendentes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};