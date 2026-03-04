import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SecureInput } from '@/components/ui/secure-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAtualizarUsuario, type Usuario } from '@/hooks/useUsuarios';
import { EditarUsuarioFormSchema } from '@/lib/security';

const formSchema = EditarUsuarioFormSchema;

type FormData = z.infer<typeof formSchema>;

interface ModalEdicaoUsuarioProps {
  usuario: Usuario;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalEdicaoUsuario: React.FC<ModalEdicaoUsuarioProps> = ({
  usuario,
  isOpen,
  onClose,
}) => {
  const atualizarUsuario = useAtualizarUsuario();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
      profile_type: usuario.profile_type,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await atualizarUsuario.mutateAsync({
        id: usuario.id,
        ...data,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const profileTypeLabels = {
    administrador: 'Administrador',
    gestor: 'Gestor',
    analista_de_estabilidade: 'Analista de Estabilidade',
    analista_de_laboratorio: 'Analista de Laboratório',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <SecureInput 
                      placeholder="Digite o nome completo" 
                      value={field.value}
                      onChange={field.onChange}
                      fieldName="nome"
                      maxLength={100}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <SecureInput 
                      type="email" 
                      placeholder="Digite o email" 
                      value={field.value}
                      onChange={field.onChange}
                      fieldName="email"
                      maxLength={255}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profile_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(profileTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={atualizarUsuario.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={atualizarUsuario.isPending}
              >
                {atualizarUsuario.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};