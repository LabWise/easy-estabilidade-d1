import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Users, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUsuarios, useDesativarUsuario, type Usuario } from '@/hooks/useUsuarios';
import { FormularioUsuario } from './FormularioUsuario';
import { ModalEdicaoUsuario } from './ModalEdicaoUsuario';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

export const TabelaUsuarios = () => {
  const { user } = useAuth();
  const { data: usuarios, isLoading } = useUsuarios();
  const desativarUsuario = useDesativarUsuario();
  const [showForm, setShowForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | undefined>();
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | undefined>();

  // Verificar se o usuário atual é admin ou gestor
  const isAdminOrManager = user?.profile_type === 'administrador' || user?.profile_type === 'gestor';
  const isAdmin = user?.profile_type === 'administrador';

  const handleEdit = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
  };

  const handleCloseEdit = () => {
    setUsuarioEditando(undefined);
  };

  const handleExcluir = async () => {
    if (usuarioParaExcluir) {
      try {
        await desativarUsuario.mutateAsync(usuarioParaExcluir.id);
        setUsuarioParaExcluir(undefined);
      } catch (error) {
        console.error('Erro ao desativar usuário:', error);
      }
    }
  };

  const profileTypeLabels = {
    administrador: 'Administrador',
    gestor: 'Gestor',
    analista_de_estabilidade: 'Analista de Estabilidade',
    analista_de_laboratorio: 'Analista de Laboratório',
  };

  const getProfileBadgeVariant = (profileType: Usuario['profile_type']) => {
    switch (profileType) {
      case 'administrador':
        return 'destructive';
      case 'gestor':
        return 'default';
      case 'analista_de_estabilidade':
        return 'secondary';
      case 'analista_de_laboratorio':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando usuários...</p>
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
              <Users className="w-5 h-5 mr-2" />
              Usuários ({usuarios?.length || 0})
            </CardTitle>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Convidar Usuário
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {isAdminOrManager && <TableHead>Email</TableHead>}
                  <TableHead>Perfil</TableHead>
                  {isAdminOrManager && <TableHead>Status</TableHead>}
                  <TableHead>Criado em</TableHead>
                  {isAdminOrManager && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios?.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    {isAdminOrManager && <TableCell>{(usuario as any).email || 'N/A'}</TableCell>}
                    <TableCell>
                      <Badge variant={getProfileBadgeVariant(usuario.profile_type)}>
                        {profileTypeLabels[usuario.profile_type]}
                      </Badge>
                    </TableCell>
                    {isAdminOrManager && (
                      <TableCell>
                        <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(usuario.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    {isAdminOrManager && (
                      <TableCell>
                        <div className="flex space-x-2">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(usuario)}
                                disabled={!usuario.ativo}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUsuarioParaExcluir(usuario)}
                                disabled={!usuario.ativo}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(!usuarios || usuarios.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={isAdminOrManager ? 6 : 3} className="text-center text-muted-foreground">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showForm && isAdmin && (
        <FormularioUsuario
          isOpen={showForm}
          onClose={() => setShowForm(false)}
        />
      )}

      {usuarioEditando && isAdmin && (
        <ModalEdicaoUsuario
          usuario={usuarioEditando}
          isOpen={true}
          onClose={handleCloseEdit}
        />
      )}

      <AlertDialog open={!!usuarioParaExcluir} onOpenChange={() => setUsuarioParaExcluir(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o usuário "{usuarioParaExcluir?.nome}"? 
              O usuário não conseguirá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={desativarUsuario.isPending}
            >
              {desativarUsuario.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};