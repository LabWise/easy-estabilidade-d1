
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Settings } from 'lucide-react';
import { useEquipamentos, Equipamento } from '@/hooks/useConfiguracoes';
import { FormularioEquipamento } from './FormularioEquipamento';

export const TabelaEquipamentos = () => {
  const { data: equipamentos, isLoading } = useEquipamentos();
  const [showForm, setShowForm] = useState(false);
  const [equipamentoEditando, setEquipamentoEditando] = useState<Equipamento | undefined>();

  const handleEdit = (equipamento: Equipamento) => {
    setEquipamentoEditando(equipamento);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEquipamentoEditando(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando equipamentos...</p>
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
              <Settings className="w-5 h-5 mr-2" />
              Equipamentos ({equipamentos?.length || 0})
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Equipamento
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Umidade</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos?.map((equipamento) => (
                  <TableRow key={equipamento.id}>
                    <TableCell className="font-mono">{equipamento.codigo}</TableCell>
                    <TableCell className="font-medium">{equipamento.nome}</TableCell>
                    <TableCell>{equipamento.tipo}</TableCell>
                    <TableCell>{equipamento.localizacao || '-'}</TableCell>
                    <TableCell>
                      {equipamento.temperatura_min && equipamento.temperatura_max
                        ? `${equipamento.temperatura_min}°C - ${equipamento.temperatura_max}°C`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {equipamento.umidade_min && equipamento.umidade_max
                        ? `${equipamento.umidade_min}% - ${equipamento.umidade_max}%`
                        : '-'}
                    </TableCell>
                    <TableCell>{equipamento.capacidade || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={equipamento.ativo ? 'default' : 'secondary'}>
                        {equipamento.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(equipamento)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!equipamentos || equipamentos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhum equipamento cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <FormularioEquipamento
          equipamento={equipamentoEditando}
          isOpen={showForm}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};
