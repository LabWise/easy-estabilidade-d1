import React from 'react';
import { Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHistoricoAnalises } from '@/hooks/useHistoricoAnalises';

interface HistoricoAlteracoesProps {
  amostraId: string;
}

export const HistoricoAlteracoes: React.FC<HistoricoAlteracoesProps> = ({ amostraId }) => {
  const { historico, isLoading, error, getTipoAlteracaoLabel } = useHistoricoAnalises({ amostraId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Alterações ({historico.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historico.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma alteração registrada para esta amostra.
          </p>
        ) : (
          <div className="space-y-4">
            {historico.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getTipoAlteracaoLabel(item.tipo_alteracao)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.data_alteracao).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {item.usuario_alteracao}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium text-sm">Justificativa:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.justificativa}
                      </p>
                    </div>
                  </div>

                  {(item.dados_antes || item.dados_depois) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                      {item.dados_antes && (
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <span className="font-medium text-red-800">Antes:</span>
                          <pre className="text-red-700 mt-1 overflow-auto">
                            {JSON.stringify(item.dados_antes, null, 2)}
                          </pre>
                        </div>
                      )}
                      {item.dados_depois && (
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <span className="font-medium text-green-800">Depois:</span>
                          <pre className="text-green-700 mt-1 overflow-auto">
                            {JSON.stringify(item.dados_depois, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};