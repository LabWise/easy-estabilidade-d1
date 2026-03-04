import React, { useState } from 'react';
import { ResponsiveLayout } from '@/components/Layout/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Beaker, Monitor } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CadastroAplicacoes = () => {
  const [tipoForm, setTipoForm] = useState({ nome: '', descricao: '' });
  const [equipamentoForm, setEquipamentoForm] = useState({ codigo: '', descricao: '', sala: '' });

  // Dados mockados
  const [tiposEstabilidade, setTiposEstabilidade] = useState([
    { id: 1, codigo: 'AC', nome: 'Acelerada', descricao: 'Teste de estabilidade acelerada', ativo: true },
    { id: 2, codigo: 'LD', nome: 'Longa Duração', descricao: 'Teste de estabilidade de longa duração', ativo: true },
    { id: 3, codigo: 'Foto', nome: 'Fotoestabilidade', descricao: 'Teste de fotoestabilidade', ativo: true },
    { id: 4, codigo: 'AP', nome: 'Acompanhamento', descricao: 'Acompanhamento de estabilidade', ativo: true },
  ]);

  const [equipamentos, setEquipamentos] = useState([
    { id: 1, codigo: 'CAM-001', descricao: 'Câmara de Estabilidade 1', sala: 'Sala A', ativo: true },
    { id: 2, codigo: 'CAM-002', descricao: 'Câmara de Estabilidade 2', sala: 'Sala A', ativo: true },
    { id: 3, codigo: 'SL001', descricao: 'Sala Climatizada 1', sala: 'Sala B', ativo: true },
    { id: 4, codigo: 'SL002', descricao: 'Sala Climatizada 2', sala: 'Sala C', ativo: true },
  ]);

  const handleAddTipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoForm.nome) return;

    const novoTipo = {
      id: Date.now(),
      codigo: tipoForm.nome.substring(0, 3).toUpperCase(),
      nome: tipoForm.nome,
      descricao: tipoForm.descricao,
      ativo: true,
    };

    setTiposEstabilidade([...tiposEstabilidade, novoTipo]);
    setTipoForm({ nome: '', descricao: '' });
    
    toast({
      title: 'Tipo adicionado com sucesso!',
      description: `${novoTipo.nome} foi cadastrado.`,
    });
  };

  const handleAddEquipamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipamentoForm.codigo || !equipamentoForm.descricao) return;

    const novoEquipamento = {
      id: Date.now(),
      codigo: equipamentoForm.codigo.toUpperCase(),
      descricao: equipamentoForm.descricao,
      sala: equipamentoForm.sala,
      ativo: true,
    };

    setEquipamentos([...equipamentos, novoEquipamento]);
    setEquipamentoForm({ codigo: '', descricao: '', sala: '' });
    
    toast({
      title: 'Equipamento adicionado com sucesso!',
      description: `${novoEquipamento.codigo} foi cadastrado.`,
    });
  };

  const handleDeleteTipo = (id: number) => {
    setTiposEstabilidade(tiposEstabilidade.filter(tipo => tipo.id !== id));
    toast({
      title: 'Tipo removido',
      description: 'O tipo de estabilidade foi removido com sucesso.',
    });
  };

  const handleDeleteEquipamento = (id: number) => {
    setEquipamentos(equipamentos.filter(equipamento => equipamento.id !== id));
    toast({
      title: 'Equipamento removido',
      description: 'O equipamento foi removido com sucesso.',
    });
  };

  return (
    <ResponsiveLayout title="Cadastro de Aplicações">
      <Tabs defaultValue="tipos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tipos" className="flex items-center space-x-2">
            <Beaker className="w-4 h-4" />
            <span>Tipos de Estabilidade</span>
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Equipamentos/Salas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tipos" className="space-y-6">
          {/* Formulário para adicionar tipos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Adicionar Tipo de Estabilidade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTipo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoNome">Nome do Tipo *</Label>
                    <Input
                      id="tipoNome"
                      value={tipoForm.nome}
                      onChange={(e) => setTipoForm({ ...tipoForm, nome: e.target.value })}
                      placeholder="Ex: Acelerada"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipoDescricao">Descrição</Label>
                    <Input
                      id="tipoDescricao"
                      value={tipoForm.descricao}
                      onChange={(e) => setTipoForm({ ...tipoForm, descricao: e.target.value })}
                      placeholder="Descrição do tipo de estabilidade"
                    />
                  </div>
                </div>
                <Button type="submit" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Tipo</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de tipos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposEstabilidade.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-mono">{tipo.codigo}</TableCell>
                      <TableCell className="font-medium">{tipo.nome}</TableCell>
                      <TableCell>{tipo.descricao}</TableCell>
                      <TableCell>
                        <Badge className={tipo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {tipo.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTipo(tipo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-6">
          {/* Formulário para adicionar equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Adicionar Equipamento/Sala</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEquipamento} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="equipamentoCodigo">Código *</Label>
                    <Input
                      id="equipamentoCodigo"
                      value={equipamentoForm.codigo}
                      onChange={(e) => setEquipamentoForm({ ...equipamentoForm, codigo: e.target.value })}
                      placeholder="Ex: CAM-003"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipamentoDescricao">Descrição *</Label>
                    <Input
                      id="equipamentoDescricao"
                      value={equipamentoForm.descricao}
                      onChange={(e) => setEquipamentoForm({ ...equipamentoForm, descricao: e.target.value })}
                      placeholder="Ex: Câmara de Estabilidade 3"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipamentoSala">Sala/Localização</Label>
                    <Input
                      id="equipamentoSala"
                      value={equipamentoForm.sala}
                      onChange={(e) => setEquipamentoForm({ ...equipamentoForm, sala: e.target.value })}
                      placeholder="Ex: Sala D"
                    />
                  </div>
                </div>
                <Button type="submit" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Equipamento</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Sala/Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipamentos.map((equipamento) => (
                    <TableRow key={equipamento.id}>
                      <TableCell className="font-mono">{equipamento.codigo}</TableCell>
                      <TableCell className="font-medium">{equipamento.descricao}</TableCell>
                      <TableCell>{equipamento.sala}</TableCell>
                      <TableCell>
                        <Badge className={equipamento.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {equipamento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteEquipamento(equipamento.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ResponsiveLayout>
  );
};

export default CadastroAplicacoes;
