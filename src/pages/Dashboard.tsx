
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Beaker, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Database,
  CheckCircle
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateSafe } from '@/lib/utils';
import { SkeletonDashboardCard, SkeletonProximasRetiradas, SkeletonAcoesRapidas } from '@/components/ui/skeleton-dashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { estatisticasGerais, proximasRetiradas, estatisticasConformidade, isLoading } = useDashboardData();

  const handleNavigateToGestao = () => {
    navigate('/gestao');
  };

  const handleNavigateToProximasRetiradas = () => {
    navigate('/proximas-retiradas');
  };


  const stats = [
    {
      title: 'Total de Amostras',
      value: estatisticasGerais?.totalAmostras?.toString() || '0',
      icon: Database,
      change: 'Todas as etiquetas',
      changeType: 'neutral' as const,
      onClick: handleNavigateToGestao
    },
    {
      title: 'Versões Ativas',
      value: estatisticasGerais?.amostrasAtivas?.toString() || '0',
      icon: Beaker,
      change: 'Em andamento',
      changeType: 'positive' as const,
      onClick: handleNavigateToGestao
    },
    {
      title: 'Próximas Retiradas (30d)',
      value: proximasRetiradas?.length?.toString() || '0',
      icon: Clock,
      change: 'Programadas',
      changeType: 'neutral' as const,
      onClick: handleNavigateToProximasRetiradas
    },
    {
      title: 'Taxa de Conformidade',
      value: `${estatisticasConformidade?.taxaConformidade || 0}%`,
      icon: CheckCircle,
      change: 'Retiradas no prazo',
      changeType: estatisticasConformidade?.taxaConformidade && estatisticasConformidade.taxaConformidade >= 95 ? 'positive' : 'negative',
      onClick: handleNavigateToGestao
    },
    {
      title: 'Input 30 dias',
      value: `${estatisticasGerais?.percentual30Dias || 0}%`,
      icon: TrendingUp,
      change: `${estatisticasGerais?.amostras30Dias || 0} versões`,
      changeType: 'positive' as const,
      onClick: handleNavigateToGestao
    },
    {
      title: 'Input 7 dias',
      value: `${estatisticasGerais?.percentual7Dias || 0}%`,
      icon: Activity,
      change: `${estatisticasGerais?.amostras7Dias || 0} versões`,
      changeType: 'positive' as const,
      onClick: handleNavigateToGestao
    },
    {
      title: 'Retiradas Atrasadas',
      value: estatisticasConformidade?.emAtraso?.toString() || '0',
      icon: AlertTriangle,
      change: 'Requer atenção',
      changeType: (estatisticasConformidade?.emAtraso || 0) > 0 ? 'negative' : 'positive',
      onClick: handleNavigateToGestao
    },
    {
      title: 'Retiradas Realizadas',
      value: estatisticasConformidade?.realizadas?.toString() || '0',
      icon: CheckCircle,
      change: 'Concluídas',
      changeType: 'positive' as const,
      onClick: handleNavigateToGestao
    }
  ];

  return (
    <ResponsiveLayout title="Dashboard Executivo">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            // Skeleton loading para estatísticas
            Array.from({ length: 8 }).map((_, index) => (
              <SkeletonDashboardCard key={index} />
            ))
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={stat.onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' :
                      'text-muted-foreground'
                    }`}>
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Próximas Retiradas */}
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            <SkeletonProximasRetiradas />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximas Retiradas (30 dias)
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNavigateToProximasRetiradas}
                >
                  Ver Todas
                </Button>
              </CardHeader>
              <CardContent>
                {proximasRetiradas && proximasRetiradas.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {proximasRetiradas.map((retirada: any) => (
                      <div 
                        key={retirada.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={handleNavigateToProximasRetiradas}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {retirada.amostras?.codigo} - {retirada.codigo_versao}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {retirada.amostras?.produtos?.nome || 'Produto não informado'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Lote: {retirada.amostras?.lote} | {retirada.tempo_coleta}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatDateSafe(retirada.data_programada)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {retirada.amostras?.tipos_estabilidade?.sigla}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma retirada programada para os próximos 30 dias</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          {isLoading ? (
            <SkeletonAcoesRapidas />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/entrada')}
                >
                  <Beaker className="h-4 w-4 mr-2" />
                  Nova Entrada de Amostras
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleNavigateToGestao}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Verificar Cronograma
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/relatorios')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/configuracoes')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Sistema Operacional</p>
                  <p className="text-xs text-muted-foreground">Banco de dados conectado</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Sincronização Ativa</p>
                  <p className="text-xs text-muted-foreground">Última atualização: agora</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  (estatisticasConformidade?.emAtraso || 0) > 0 ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div>
                  <p className="font-medium">
                    {(estatisticasConformidade?.emAtraso || 0) > 0 ? 'Atenção Requerida' : 'Tudo em Ordem'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(estatisticasConformidade?.emAtraso || 0) > 0 
                      ? `${estatisticasConformidade?.emAtraso} retirada(s) em atraso`
                      : 'Cronograma em dia'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default Dashboard;
