import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const emailSchema = z.object({
  email: z.string().email('Digite um email válido'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);

    try {
      // Primeiro verificar se o email existe na tabela usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', data.email)
        .eq('ativo', true)
        .single();

      if (userError || !userData) {
        // Por segurança, sempre mostrar mensagem de sucesso mesmo se email não existir
        // para não vazar informações sobre usuários cadastrados
        console.log('Email não encontrado na base de usuários');
      }

      // Enviar email de reset independentemente (o Supabase não enviará se não existir)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/set-password`,
        }
      );

      if (resetError) {
        throw new Error('Erro ao enviar email: ' + resetError.message);
      }

      setIsSuccess(true);
      toast.success('Procedimento de recuperação iniciado!');
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
        form.reset();
      }, 3000);

    } catch (err: any) {
      console.error('Erro ao solicitar reset de senha:', err);
      toast.error(err.message || 'Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
        setIsSuccess(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center">
            {isSuccess ? 'Email Enviado!' : 'Esqueci Minha Senha'}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Se o email estiver cadastrado em nossa base, você receberá um link para redefinir sua senha.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e pasta de spam.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                Digite o email associado à sua conta e enviaremos um link para redefinir sua senha.
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Email
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};