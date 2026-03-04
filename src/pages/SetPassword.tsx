import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

const passwordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Helper function to get URL parameters
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
    const type = urlParams.get('type') || hashParams.get('type');
    return { urlParams, hashParams, tokenHash, type };
  };

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Verificar se há um token na URL (usuário veio do email)
    // O Supabase pode enviar os parâmetros tanto como query params quanto como hash fragments
    const { tokenHash, type } = getUrlParams();
    
    console.log('SetPassword - URL completa:', window.location.href);
    console.log('SetPassword - Search params:', window.location.search);
    console.log('SetPassword - Hash:', window.location.hash);
    console.log('SetPassword - Token encontrado:', tokenHash);
    console.log('SetPassword - Type encontrado:', type);

    // Se não há token, verificar se o usuário chegou aqui através do processo de verificação do Supabase
    if (!tokenHash) {
      // Tentar detectar se chegou através de callback de auth
      const handleAuthStateChange = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !session.user.user_metadata?.password_set) {
          // Usuário acabou de ser verificado mas ainda não definiu senha
          console.log('SetPassword - Usuário verificado aguardando definir senha');
          return; // Permite continuar
        }
        if (!session) {
          setError('Link inválido ou expirado. Solicite um novo convite.');
        }
      };
      
      handleAuthStateChange();
    } else if (type !== 'invite' && type !== 'recovery') {
      setError('Link inválido ou expirado.');
    }
  }, [searchParams]);

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Primeiro, verificar se já existe uma sessão ativa (usuário veio através de callback)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('SetPassword - Sessão ativa encontrada, definindo senha diretamente');
        
        // Definir a senha para usuário já autenticado
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (updateError) {
          throw new Error('Erro ao definir senha: ' + updateError.message);
        }

        toast.success('Senha definida com sucesso! Redirecionando...');
        
        // Redirecionar para dashboard após sucesso
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
        return;
      }

      // Se não há sessão, tentar verificar token da URL
      const { tokenHash, type } = getUrlParams();
      
      if (!tokenHash) {
        throw new Error('Token não encontrado. Verifique se você clicou no link correto do email.');
      }

      console.log('SetPassword - Tentando verificar token:', tokenHash);

      // Verificar e aceitar o convite ou reset de senha
      const otpType = type === 'recovery' ? 'recovery' : 'invite';
      
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });

      console.log('SetPassword - Resultado da verificação:', { verifyData, verifyError });

      if (verifyError) {
        throw new Error('Link inválido ou expirado: ' + verifyError.message);
      }

      // Definir a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw new Error('Erro ao definir senha: ' + updateError.message);
      }

      toast.success('Senha definida com sucesso! Redirecionando...');
      
      // Redirecionar para dashboard após sucesso
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao definir senha:', err);
      setError(err.message || 'Erro ao definir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">
              {(() => {
                const { type } = getUrlParams();
                return type === 'recovery' ? 'Redefinir Senha' : 'Definir Senha';
              })()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const { type } = getUrlParams();
                return type === 'recovery' 
                  ? 'Digite sua nova senha para redefinir o acesso'
                  : 'Defina sua senha para acessar o sistema';
              })()}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha"
                          disabled={isLoading || !!error}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirme sua senha"
                          disabled={isLoading || !!error}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !!error}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Definir Senha
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;