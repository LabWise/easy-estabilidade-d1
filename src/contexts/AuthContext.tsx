import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  empresa_id: number;
  profile_type: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearAuthCache: () => void;
  isAuthenticated: boolean;
}

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isValidatingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const subscriptionRef = useRef<any>(null);
  const userCacheRef = useRef<User | null>(null);
  const lastValidationSessionRef = useRef<string | null>(null);
  const cacheExpiryRef = useRef<number | null>(null);
  const userStatusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para limpar todo o cache de autenticação
  const clearAuthCache = useCallback(() => {
    console.log('Clearing auth cache...');
    userCacheRef.current = null;
    lastValidationSessionRef.current = null;
    cacheExpiryRef.current = null;
    
    // Limpar localStorage do Supabase de forma mais específica
    try {
      const authKeys = [
        'sb-vgxgqvbiqzzidovizzhc-auth-token',
        'supabase.auth.token'
      ];
      
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });
      
      // Limpar apenas chaves relacionadas ao auth do Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth') && key.includes('vgxgqvbiqzzidovizzhc')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key}:`, e);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }, []);

  // Refresh da sessão com retry automático
  const refreshSession = useCallback(async (): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Refreshing session... (attempt ${retryCount + 1})`);
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh failed:', error);
          if (retryCount === maxRetries - 1) {
            setError('Sessão expirada. Faça login novamente.');
            return false;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }

        if (data.session) {
          console.log('Session refreshed successfully');
          setSession(data.session);
          // Limpar cache para forçar nova validação
          userCacheRef.current = null;
          lastValidationSessionRef.current = null;
          cacheExpiryRef.current = null;
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('Session refresh error:', err);
        if (retryCount === maxRetries - 1) {
          setError('Erro ao renovar sessão');
          return false;
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    return false;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Log logout antes de executar signOut
      if (user && session) {
        try {
          const logData = {
            empresa_id: user.empresa_id,
            usuario_id: user.id,
            acao: 'logout',
            tabela: 'auth.users',
            registro_id: session.user.id,
            dados_antes: {
              user_id: session.user.id,
              email: user.email,
              nome: user.name,
              session_expires_at: session.expires_at,
              access_token: session.access_token ? 'present' : 'absent'
            },
            dados_depois: null
          };

          await supabase.from('logs_auditoria').insert(logData);
        } catch (logError) {
          console.error('Erro ao registrar log de logout:', logError);
        }
      }

      // Limpar timer de verificação de status
      if (userStatusCheckIntervalRef.current) {
        clearInterval(userStatusCheckIntervalRef.current);
        userStatusCheckIntervalRef.current = null;
      }

      // Limpar todo o cache de autenticação
      clearAuthCache();
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setError('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [user, session, clearAuthCache]);

  // Função para verificar status do usuário periodicamente
  const startUserStatusCheck = useCallback((userId: string) => {
    // Limpar timer anterior se existir
    if (userStatusCheckIntervalRef.current) {
      clearInterval(userStatusCheckIntervalRef.current);
    }

    // Verificar status a cada 5 minutos
    userStatusCheckIntervalRef.current = setInterval(async () => {
      try {
        console.log('Checking user status...');
        const { data: userData } = await supabase
          .from('usuarios')
          .select('id, ativo')
          .eq('id', userId)
          .maybeSingle();

        if (!userData || !userData.ativo) {
          console.log('User has been deactivated, forcing logout...');
          
          // Log do logout automático
          try {
            await supabase.from('logs_auditoria').insert({
              empresa_id: user?.empresa_id || null,
              usuario_id: userId,
              acao: 'auto_logout_inactive',
              tabela: 'usuarios',
              registro_id: userId,
              dados_antes: {
                user_id: userId,
                email: user?.email,
                nome: user?.name,
                ativo: userData?.ativo || false,
                auto_logout_timestamp: new Date().toISOString()
              },
              dados_depois: null
            });
          } catch (logError) {
            console.error('Erro ao registrar logout automático:', logError);
          }

          toast.error('Sua conta foi desabilitada. Você será desconectado.');
          await logout();
        }
      } catch (error) {
        console.error('Erro ao verificar status do usuário:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }, [user, logout]);

  // Validar usuário com estratégia optimistic
  const validateUser = useCallback(async (session: Session) => {
    // Cache por 5 minutos (reduzido para melhor performance)
    const now = Date.now();
    const tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const cacheExpiry = cacheExpiryRef.current;
    
    // Cache reduzido: válido até 5 min ou até 3 min antes da expiração do token
    const cacheValidUntil = Math.min(
      tokenExpiresAt - (3 * 60 * 1000), // 3 min antes da expiração
      Date.now() + (5 * 60 * 1000) // ou 5 minutos
    );
    
    const isCacheExpired = !cacheExpiry || now > cacheExpiry;
    
    // Verificar se já validamos esta sessão e cache ainda é válido
    if (lastValidationSessionRef.current === session.access_token && !isCacheExpired) {
      console.log('User already validated for this session, using cache');
      if (userCacheRef.current) {
        setUser(userCacheRef.current);
        setLoading(false);
        return;
      }
    }

    // Se cache expirou, limpar
    if (isCacheExpired) {
      console.log('Cache expired, clearing...');
      userCacheRef.current = null;
      lastValidationSessionRef.current = null;
    }

    // Verificar se validação está em progresso
    if (isValidatingRef.current) {
      console.log('User validation already in progress, skipping...');
      return;
    }

    try {
      isValidatingRef.current = true;
      console.log('Validating user for session:', session.user.id);
      
      // Optimistic Auth: Mostrar dados básicos imediatamente
      if (session.user.email && !userCacheRef.current) {
        const optimisticUser: User = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          empresa_id: 1,
          profile_type: 'analista_de_laboratorio'
        };
        setUser(optimisticUser);
        setLoading(false);
        console.log('Optimistic user set, validating in background...');
      }
      
      // Timeout reduzido para 3 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Validation timeout')), 3000)
      );
      
      const validationPromise = supabase
        .from('usuarios')
        .select('id, nome, email, empresa_id, profile_type, ativo')
        .eq('auth_id', session.user.id)
        .eq('ativo', true)
        .maybeSingle();

      const { data, error } = await Promise.race([validationPromise, timeoutPromise]) as any;

      if (error) {
        console.error('User validation failed:', error);
        // Fallback: tentar usar dados da sessão do Supabase
        if (session.user.email) {
          console.log('Using fallback user data from session');
          const fallbackUser: User = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email.split('@')[0],
            empresa_id: 1, // empresa padrão
            profile_type: 'analista_de_laboratorio'
          };
          setUser(fallbackUser);
          setError('');
          setLoading(false);
          return;
        }
        setError('Usuário não encontrado no sistema');
        setUser(null);
        setSession(null);
        return;
      }

      if (!data) {
        // Verificar se o usuário existe mas está inativo
        const { data: inactiveUser } = await supabase
          .from('usuarios')
          .select('id, nome, email, ativo')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (inactiveUser && !inactiveUser.ativo) {
          console.error('User account is inactive');
          
          // Log da tentativa de login de usuário inativo
          try {
            await supabase.from('logs_auditoria').insert({
              empresa_id: null,
              usuario_id: inactiveUser.id,
              acao: 'login_blocked_inactive',
              tabela: 'usuarios',
              registro_id: inactiveUser.id,
              dados_antes: {
                user_id: session.user.id,
                email: inactiveUser.email,
                nome: inactiveUser.nome,
                ativo: inactiveUser.ativo,
                attempt_timestamp: new Date().toISOString()
              },
              dados_depois: null
            });
          } catch (logError) {
            console.error('Erro ao registrar tentativa de login de usuário inativo:', logError);
          }

          setError('Usuário foi desabilitado pelo administrador. Entre em contato com o suporte.');
          await logout();
          return;
        }

        console.error('No user data found');
        setError('Usuário não encontrado no sistema');
        setUser(null);
        setSession(null);
        return;
      }

      // Sucesso - processar e cachear dados do usuário
      const userData: User = {
        id: data.id,
        email: data.email || session.user.email || '',
        name: data.nome || '',
        empresa_id: data.empresa_id,
        profile_type: data.profile_type || 'analista_de_laboratorio'
      };

      // Cachear o usuário e marcar esta sessão como validada
      userCacheRef.current = userData;
      lastValidationSessionRef.current = session.access_token;
      cacheExpiryRef.current = cacheValidUntil;

      setUser(userData);
      setError('');
      console.log('User validation successful - session cached until:', new Date(cacheValidUntil));
      
      // Iniciar verificação periódica do status do usuário após login bem-sucedido
      startUserStatusCheck(userData.id);
      
    } catch (err) {
      console.error('User validation error:', err);
      
      // Fallback em caso de erro total
      if (session.user.email) {
        console.log('Using emergency fallback due to validation error');
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          empresa_id: 1,
          profile_type: 'analista_de_laboratorio'
        };
        setUser(fallbackUser);
        setError('');
      } else {
        setError('Erro ao validar usuário');
      }
    } finally {
      isValidatingRef.current = false;
      setLoading(false);
    }
  }, [startUserStatusCheck, logout]);

  // Login - fluxo simplificado
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting login process...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login failed:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('Login successful - onAuthStateChange will handle validation');
      // Não fazer setLoading(false) aqui - deixar o onAuthStateChange/validateUser fazer
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao fazer login');
      setLoading(false);
    }
  }, []);


  // Configurar listener de mudanças de auth (simplificado)
  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('Auth already initialized, skipping...');
      return;
    }

    console.log('Starting auth initialization...');
    isInitializedRef.current = true;

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setLoading(false);
          // Limpar todo o cache
          clearAuthCache();
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in, validating...');
          setSession(session);
          await validateUser(session);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token renovado automaticamente pelo Supabase - apenas atualizar sessão
          setSession(session);
          console.log('Token refreshed automatically');
        }
      }
    );

    subscriptionRef.current = subscription;

    // Verificar se já existe uma sessão válida
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Initial session found, validating user...');
          setSession(session);
          await validateUser(session);
        } else {
          console.log('No initial session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [validateUser]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    login,
    logout,
    refreshSession,
    clearAuthCache,
    isAuthenticated: !!user && !!session
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
