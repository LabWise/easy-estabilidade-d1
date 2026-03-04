
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Package } from 'lucide-react';
import { useProdutos, Produto } from '@/hooks/useConfiguracoes';
import { FormularioProduto } from './FormularioProduto';

export const TabelaProdutos = () => {
  const { data: produtos, isLoading } = useProdutos();
  const [showForm, setShowForm] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>();

  const handleEdit = (produto: Produto) => {
    setProdutoEditando(produto);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setProdutoEditando(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando produtos...</p>
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
              <Package className="w-5 h-5 mr-2" />
              Produtos Controlados ({produtos?.length || 0})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Princípio Ativo</TableHead>
                  <TableHead>Concentração</TableHead>
                  <TableHead>Forma Farmacêutica</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos?.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{produto.principio_ativo || '-'}</TableCell>
                    <TableCell>{produto.concentracao || '-'}</TableCell>
                    <TableCell>{produto.forma_farmaceutica || '-'}</TableCell>
                    <TableCell>{produto.fabricante || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={produto.ativo ? 'default' : 'secondary'}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!produtos || produtos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <FormularioProduto
          produto={produtoEditando}
          isOpen={showForm}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};
