import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, Calendar, Filter, Clock, Target, Zap } from 'lucide-react';

type FiltroRapido = '7dias' | '15dias' | '30dias' | 'personalizado' | 'todos';

interface FiltrosRelatorioProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filtroRapido: FiltroRapido;
  setFiltroRapido: (value: FiltroRapido) => void;
  dataInicio?: Date;
  setDataInicio: (date: Date | undefined) => void;
  dataFim?: Date;
  setDataFim: (date: Date | undefined) => void;
  onExportCSV: () => void;
}

export const FiltrosRelatorio: React.FC<FiltrosRelatorioProps> = ({
  searchTerm,
  setSearchTerm,
  filtroRapido,
  setFiltroRapido,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  onExportCSV
}) => {
  

  const filtrosRapidos = [
    {
      id: '7dias',
      label: '7 dias',
      icon: Zap,
      description: 'Próximos 7 dias',
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
    },
    {
      id: '15dias',
      label: '15 dias',
      icon: Target,
      description: 'Próximos 15 dias',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      id: '30dias',
      label: '30 dias',
      icon: Clock,
      description: 'Próximos 30 dias',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      id: 'personalizado',
      label: 'Personalizado',
      icon: Calendar,
      description: 'Escolher período',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    },
    {
      id: 'todos',
      label: 'Mostrar Tudo',
      icon: Filter,
      description: 'Todas as amostras',
      color: 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com busca e exportação */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
                Buscar amostras
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código, produto, lote, fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-white/80 border-2 border-white/50 focus:border-blue-400 transition-all duration-200"
                />
              </div>
            </div>
            
            <Button 
              onClick={onExportCSV} 
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <Download className="h-5 w-5" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros rápidos em cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtrosRapidos.map((filtro) => {
          const isActive = filtroRapido === filtro.id;
          const Icon = filtro.icon;
          
          return (
            <Card 
              key={filtro.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-102 ${
                isActive 
                  ? 'border-2 border-primary shadow-md ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setFiltroRapido(filtro.id as FiltroRapido)}
            >
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  isActive ? filtro.color : 'bg-muted'
                } transition-all duration-200`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <h3 className={`text-sm font-semibold mb-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {filtro.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {filtro.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros condicionais */}
      {filtroRapido === 'personalizado' && (
        <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Calendar className="h-5 w-5" />
              Período Personalizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Início</Label>
                <DatePicker
                  date={dataInicio}
                  onDateChange={setDataInicio}
                  placeholder="Selecione data início"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Fim</Label>
                <DatePicker
                  date={dataFim}
                  onDateChange={setDataFim}
                  placeholder="Selecione data fim"
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};