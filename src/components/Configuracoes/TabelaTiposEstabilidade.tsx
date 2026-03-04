
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Beaker } from 'lucide-react';
import { useTiposEstabilidade, TipoEstabilidade } from '@/hooks/useConfiguracoes';
import { FormularioTipoEstabilidade } from './FormularioTipoEstabilidade';

export const TabelaTiposEstabilidade = () => {
  const { data: tipos, isLoading } = useTiposEstabilidade();
  const [showForm, setShowForm] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoEstabilidade | undefined>();

  const handleEdit = (tipo: TipoEstabilidade) => {
    setTipoEditando(tipo);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTipoEditando(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Beaker className="w-5 h-5 mr-2" />
            Tipos de Estabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando tipos de estabilidade...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Beaker className="w-5 h-5 mr-2" />
              Tipos de Estabilidade ({tipos?.length || 0})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tipos?.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-mono font-medium">{tipo.sigla}</TableCell>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>{tipo.descricao || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={tipo.ativo ? 'default' : 'secondary'}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tipo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!tipos || tipos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum tipo de estabilidade cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <FormularioTipoEstabilidade
          tipo={tipoEditando}
          isOpen={showForm}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};
