import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface StatusRetiradaConfig {
  id: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

interface SelecionarStatusRetiradaProps {
  value?: string;
  onChange: (statusId: string, statusDescricao: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export const SelecionarStatusRetirada: React.FC<SelecionarStatusRetiradaProps> = ({
  value,
  onChange,
  disabled = false,
  required = true,
  placeholder = "Selecione o status da retirada..."
}) => {
  // Buscar configurações de status ativas
  const { data: statusConfiguracoes = [], isLoading } = useQuery({
    queryKey: ['status-retirada-configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_retirada_configuracoes')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) {
        console.error('Erro ao buscar configurações de status:', error);
        throw error;
      }

      return data as StatusRetiradaConfig[];
    }
  });

  const handleValueChange = (statusId: string) => {
    const statusSelecionado = statusConfiguracoes.find(s => s.id === statusId);
    if (statusSelecionado) {
      onChange(statusId, statusSelecionado.descricao);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Status da Retirada {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex items-center justify-center p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Carregando status...</span>
        </div>
      </div>
    );
  }

  if (statusConfiguracoes.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Status da Retirada {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="p-3 border rounded-md bg-muted">
          <span className="text-sm text-muted-foreground">
            Nenhum status configurado. Configure os status em Configurações.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Status da Retirada {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {statusConfiguracoes.map((status) => (
            <SelectItem key={status.id} value={status.id}>
              {status.descricao}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};