import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusMacroSubamostra } from '@/hooks/useStatusMacroSubamostra';

interface StatusBadgeProps {
  status: StatusMacroSubamostra;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: StatusMacroSubamostra) => {
    switch (status) {
      case 'liberado_para_analise':
        return {
          variant: 'default' as const,
          label: 'Liberado para Análise'
        };
      case 'analise_iniciada':
        return {
          variant: 'secondary' as const,
          label: 'Análise Iniciada'
        };
      case 'analises_concluidas':
        return {
          variant: 'outline' as const,
          label: 'Análises Concluídas'
        };
      default:
        return {
          variant: 'outline' as const,
          label: 'Status Desconhecido'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};