import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface TipoAnalise {
  id: string;
  descricao: string;
  detalhamento?: string;
  ativo: boolean;
}

interface SelecionarAnalisesProps {
  analisesIds: string[];
  setAnalisesIds: (ids: string[]) => void;
}

export const SelecionarAnalises: React.FC<SelecionarAnalisesProps> = ({
  analisesIds,
  setAnalisesIds
}) => {
  const { data: tiposAnalise = [], isLoading } = useQuery({
    queryKey: ['tipos-analise-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_analise')
        .select('*')
        .eq('ativo', true)
        .order('descricao');
      
      if (error) throw error;
      return data as TipoAnalise[];
    }
  });

  const handleAnaliseToggle = (analiseId: string, checked: boolean) => {
    if (checked) {
      setAnalisesIds([...analisesIds, analiseId]);
    } else {
      setAnalisesIds(analisesIds.filter(id => id !== analiseId));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleção de Análises *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Seleção de Análises *
          <Badge variant="secondary">
            {analisesIds.length} selecionadas
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione as análises que serão realizadas para esta amostra
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
          {tiposAnalise.map(analise => (
            <div key={analise.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={`analise-${analise.id}`}
                checked={analisesIds.includes(analise.id)}
                onCheckedChange={(checked) => handleAnaliseToggle(analise.id, !!checked)}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`analise-${analise.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {analise.descricao}
                </Label>
                {analise.detalhamento && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {analise.detalhamento}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {tiposAnalise.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum tipo de análise disponível.</p>
            <p className="text-xs mt-1">
              Configure os tipos de análise em Configurações &gt; Cadastro de Análise
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};