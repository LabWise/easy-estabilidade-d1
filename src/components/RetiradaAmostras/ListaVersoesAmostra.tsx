
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { SelecionarStatusRetirada } from './SelecionarStatusRetirada';

interface VersaoAmostra {
  id: string;
  codigo_versao: string;
  tempo_coleta: string;
  data_programada: string;
  realizada: boolean | null;
  sequencia_valida: boolean;
}

interface ListaVersoesAmostraProps {
  versoes: VersaoAmostra[];
  onVersaoSelecionada: (codigoVersao: string, statusRetirada?: { id: string; descricao: string; }) => void;
  isLoading?: boolean;
}

export const ListaVersoesAmostra: React.FC<ListaVersoesAmostraProps> = ({
  versoes,
  onVersaoSelecionada,
  isLoading = false
}) => {
  const [statusSelecionados, setStatusSelecionados] = useState<Record<string, { id: string; descricao: string; }>>({});
  const getStatusIcon = (realizada: boolean | null, sequenciaValida: boolean) => {
    if (realizada) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (!sequenciaValida) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getStatusVariant = (realizada: boolean | null, sequenciaValida: boolean) => {
    if (realizada) return 'default';
    if (!sequenciaValida) return 'secondary';
    return 'outline';
  };

  const getStatusText = (realizada: boolean | null, sequenciaValida: boolean) => {
    if (realizada) return 'Realizada';
    if (!sequenciaValida) return 'Aguardar sequência';
    return 'Disponível';
  };

  if (versoes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Nenhuma versão encontrada para esta amostra.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-blue-700 dark:text-blue-300">
          Amostras em Estabilidade
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione uma versão para retirada (deve seguir a sequência):
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versoes.map((versao) => (
            <div
              key={versao.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-medium text-lg">
                    {versao.codigo_versao}
                  </span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(versao.realizada, versao.sequencia_valida)}
                    <Badge variant={getStatusVariant(versao.realizada, versao.sequencia_valida)}>
                      {getStatusText(versao.realizada, versao.sequencia_valida)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Tempo:</span>
                    <p>{versao.tempo_coleta}</p>
                  </div>
                  <div>
                    <span className="font-medium">Data Programada:</span>
                    <p>{formatDateSafe(versao.data_programada)}</p>
                  </div>
                </div>

                {/* Seleção de Status apenas para versões disponíveis */}
                {versao.sequencia_valida && !versao.realizada && (
                  <div className="mt-3 pt-3 border-t">
                    <SelecionarStatusRetirada
                      value={statusSelecionados[versao.codigo_versao]?.id}
                      onChange={(statusId, statusDescricao) => {
                        setStatusSelecionados(prev => ({
                          ...prev,
                          [versao.codigo_versao]: { id: statusId, descricao: statusDescricao }
                        }));
                      }}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                <Button
                  onClick={() => onVersaoSelecionada(
                    versao.codigo_versao, 
                    statusSelecionados[versao.codigo_versao]
                  )}
                  disabled={
                    isLoading || 
                    versao.realizada === true || 
                    !versao.sequencia_valida ||
                    (versao.sequencia_valida && !versao.realizada && !statusSelecionados[versao.codigo_versao])
                  }
                  variant={versao.sequencia_valida && !versao.realizada ? "default" : "secondary"}
                  size="sm"
                >
                  {versao.realizada ? 'Já Retirada' : 
                   !versao.sequencia_valida ? 'Aguardar' : 'Selecionar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
