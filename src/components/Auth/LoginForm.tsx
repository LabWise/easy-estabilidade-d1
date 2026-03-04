import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const LOGO_URL = "https://vfhebnctlsyiduwciiuo.supabase.co/storage/v1/object/public/icons/easyestabilidade-logo.png";

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form não deve forçar logout - isso é responsabilidade do AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-[250px] h-[98px] bg-white rounded-lg flex items-center justify-center">
              <img 
                src={LOGO_URL} 
                alt="Easy Estabilidade Logo" 
                className="w-[250px] h-[98px] object-contain"
              />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mt-2">Sistema de Gestão de Amostras</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          </div>
          
          <div className="text-center mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Copyright © 2025 LabWise. Todos os direitos reservados.
            </p>
          </div>
        </CardContent>

        <ForgotPasswordModal 
          open={showForgotPassword}
          onOpenChange={setShowForgotPassword}
        />
      </Card>
    </div>
  );
};
