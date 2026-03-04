
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { PeriodoRetirada } from '@/hooks/useConfiguracoes';

interface PeriodosRetiradaProps {
  periodos: PeriodoRetirada[];
  onChange: (periodos: PeriodoRetirada[]) => void;
}

export const PeriodosRetirada: React.FC<PeriodosRetiradaProps> = ({
  periodos,
  onChange
}) => {
  const adicionarPeriodo = () => {
    const novoPeriodo: PeriodoRetirada = {
      periodo: '',
      dias: 0
    };
    onChange([...periodos, novoPeriodo]);
  };

  const removerPeriodo = (index: number) => {
    const novosPeriodos = periodos.filter((_, i) => i !== index);
    onChange(novosPeriodos);
  };

  const atualizarPeriodo = (index: number, campo: keyof PeriodoRetirada, valor: string | number) => {
    const novosPeriodos = [...periodos];
    novosPeriodos[index] = {
      ...novosPeriodos[index],
      [campo]: valor
    };
    onChange(novosPeriodos);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Períodos de Retirada</CardTitle>
          <Button type="button" onClick={adicionarPeriodo} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Período
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {periodos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum período configurado. Clique em "Adicionar Período" para começar.
          </p>
        ) : (
          periodos.map((periodo, index) => (
            <div key={index} className="flex items-end gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor={`periodo-${index}`}>Período</Label>
                <SecureInput
                  id={`periodo-${index}`}
                  placeholder="Ex: 3M, 6M, 12M"
                  value={periodo.periodo}
                  onChange={(valor) => atualizarPeriodo(index, 'periodo', valor)}
                  fieldName="período"
                  maxLength={20}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`meses-${index}`}>Meses</Label>
                <Input
                  id={`meses-${index}`}
                  type="number"
                  placeholder="Ex: 3, 6, 12"
                  value={Math.round((periodo.dias || 0) / 30) || ''}
                  onChange={(e) => {
                    const meses = parseInt(e.target.value) || 0;
                    const dias = Math.round(meses * 30.44); // Média de dias por mês
                    atualizarPeriodo(index, 'dias', dias);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removerPeriodo(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
        {periodos.length > 0 && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <strong>Dica:</strong> O campo "Período" é usado para identificação (ex: 3M, 6M) e "Meses" 
            determina quantos meses após a data de entrada a retirada será programada. O número de meses deve ser inteiro. O sistema calcula automaticamente os dias.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
