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
import { useConvidarUsuario, type ConviteUsuario } from '@/hooks/useUsuarios';
import { UsuarioFormSchema } from '@/lib/security';

const formSchema = UsuarioFormSchema;

interface FormularioUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  isOpen,
  onClose,
}) => {
  const conviteUsuario = useConvidarUsuario();

  const form = useForm<ConviteUsuario>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      profile_type: 'analista_de_laboratorio',
    },
  });

  const onSubmit = async (data: ConviteUsuario) => {
    try {
      await conviteUsuario.mutateAsync(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
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
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
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
                      value={field.value}
                      onChange={field.onChange}
                      fieldName="Nome"
                      placeholder="Digite o nome completo"
                      required
                      maxLength={100}
                      showError={false}
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
                      value={field.value}
                      onChange={field.onChange}
                      fieldName="Email"
                      placeholder="Digite o email"
                      required
                      maxLength={255}
                      showError={false}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[200]">
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
                disabled={conviteUsuario.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={conviteUsuario.isPending}
              >
                {conviteUsuario.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar Convite
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};