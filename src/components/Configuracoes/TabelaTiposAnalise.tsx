
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useTiposAnalise, 
  useConfiguracaoAnalise, 
  useSaveConfiguracaoAnalise,
  TipoAnalise 
} from '@/hooks/useAnalises';
import { FormularioTipoAnalise } from './FormularioTipoAnalise';
import { Skeleton } from '@/components/ui/skeleton';

export const TabelaTiposAnalise: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoAnalise | null>(null);
  const [diasAnalise, setDiasAnalise] = useState(30);

  const { data: tipos, isLoading, error } = useTiposAnalise();
  const { data: configuracao, isLoading: loadingConfig } = useConfiguracaoAnalise();
  const saveConfigMutation = useSaveConfiguracaoAnalise();

  React.useEffect(() => {
    if (configuracao) {
      setDiasAnalise(configuracao.dias_analise);
    }
  }, [configuracao]);

  const handleEdit = (tipo: TipoAnalise) => {
    setTipoEditando(tipo);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTipoEditando(null);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(diasAnalise);
  };

  // Loading state otimizado
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Análises</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              Erro ao carregar tipos de análise. Tente recarregar a página.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuração de Dias */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Análises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="diasAnalise">
                Quantidade de dias para realizar análises laboratoriais
              </Label>
              {loadingConfig ? (
                <Skeleton className="h-10 w-48 mt-2" />
              ) : (
                <Input
                  id="diasAnalise"
                  type="number"
                  min="1"
                  value={diasAnalise}
                  onChange={(e) => setDiasAnalise(Number(e.target.value))}
                  className="max-w-xs mt-2"
                />
              )}
            </div>
            <Button 
              onClick={handleSaveConfig}
              disabled={saveConfigMutation.isPending || loadingConfig}
            >
              {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Tipos de Análise */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tipos de Análise</CardTitle>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Detalhamento</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos?.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">
                    {tipo.descricao}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {tipo.detalhamento || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tipo.ativo ? "default" : "secondary"}>
                      {tipo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tipo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!tipos || tipos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum tipo de análise encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormularioTipoAnalise
        isOpen={showForm}
        onClose={handleCloseForm}
        tipoAnalise={tipoEditando}
      />
    </div>
  );
};
