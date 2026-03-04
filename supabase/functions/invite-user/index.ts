import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConviteRequest {
  nome: string;
  email: string;
  profile_type: 'administrador' | 'gestor' | 'analista_de_estabilidade' | 'analista_de_laboratorio';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[INVITE-USER v2.0] Função iniciada em:', new Date().toISOString());
    
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('[DEBUG] Variáveis de ambiente:', {
      supabaseUrl: supabaseUrl ? 'DEFINIDA' : 'INDEFINIDA',
      serviceRoleKey: serviceRoleKey ? 'DEFINIDA' : 'INDEFINIDA'
    });

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas');
    }

    // Verificar se usuário está autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }
    
    console.log('[DEBUG] Header de autorização encontrado');

    // Criar cliente Supabase com service role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('[DEBUG] Cliente admin criado com sucesso');

    // Criar cliente Supabase para verificar usuário atual
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar se o usuário atual é administrador
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar dados do usuário na tabela usuarios
    const { data: usuarioAtual, error: userError } = await supabase
      .from('usuarios')
      .select('profile_type, empresa_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !usuarioAtual) {
      throw new Error('Usuário não encontrado');
    }

    if (usuarioAtual.profile_type !== 'administrador') {
      throw new Error('Apenas administradores podem convidar usuários');
    }

    // Ler dados da requisição
    const { nome, email, profile_type }: ConviteRequest = await req.json();

    console.log('[DEBUG] Convidando usuário:', { nome, email, profile_type });

    // Verificar se email já existe na tabela usuarios
    console.log('[DEBUG] Verificando email na tabela usuarios:', email);
    const { data: existingUserInTable, error: tableError } = await supabase
      .from('usuarios')
      .select('id, auth_id')
      .eq('email', email)
      .single();

    console.log('[DEBUG] Resultado da busca na tabela usuarios:', {
      encontrado: !!existingUserInTable,
      erro: tableError?.message,
      dados: existingUserInTable
    });

    // Verificar se usuário existe na auth.users e se já confirmou
    console.log('[DEBUG] Verificando usuários na auth.users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('[DEBUG] Erro ao buscar usuários na auth.users:', authError);
      throw new Error(`Erro ao verificar usuários existentes: ${authError.message}`);
    }
    
    const existingAuthUser = authUsers.users?.find(user => user.email === email);
    
    console.log('[DEBUG] Resultado da busca na auth.users:', {
      totalUsuarios: authUsers.users?.length || 0,
      encontrado: !!existingAuthUser,
      emailConfirmado: existingAuthUser?.email_confirmed_at ? 'SIM' : 'NÃO',
      dadosUsuario: existingAuthUser ? {
        id: existingAuthUser.id,
        email: existingAuthUser.email,
        email_confirmed_at: existingAuthUser.email_confirmed_at,
        invited_at: existingAuthUser.invited_at
      } : null
    });

    // Verificação de situações existentes
    console.log('[DEBUG] Analisando situação do email...');
    
    // Se usuário existe na tabela usuarios E já confirmou na auth, bloquear
    if (existingUserInTable && existingAuthUser && existingAuthUser.email_confirmed_at) {
      console.log('[DEBUG] Email já confirmado e registrado - BLOQUEANDO');
      throw new Error('Este email já está cadastrado e confirmado no sistema');
    }
    
    // Se existe apenas na tabela usuarios mas não na auth, limpar dados órfãos
    if (existingUserInTable && !existingAuthUser) {
      console.log('[DEBUG] Dados órfãos encontrados na tabela usuarios (sem auth) - removendo...');
      await supabase
        .from('usuarios')
        .delete()
        .eq('id', existingUserInTable.id);
      console.log('[DEBUG] Dados órfãos removidos');
    }

    // Se usuário existe apenas na auth.users mas não confirmou, permitir reenvio
    if (existingAuthUser && !existingAuthUser.email_confirmed_at) {
      console.log('Reenviando convite para usuário não confirmado:', email);
      
      // Atualizar dados do usuário existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          user_metadata: {
            nome,
            profile_type,
            empresa_id: usuarioAtual.empresa_id,
          }
        }
      );

      if (updateError) {
        console.error('Erro ao atualizar dados do usuário:', updateError);
      }

      // Se existe na tabela usuarios, atualizar
      if (existingUserInTable) {
        await supabase
          .from('usuarios')
          .update({
            nome,
            profile_type,
            ativo: true,
          })
          .eq('id', existingUserInTable.id);
      } else {
        // Se não existe na tabela usuarios, criar registro
        await supabase
          .from('usuarios')
          .insert({
            auth_id: existingAuthUser.id,
            nome,
            email,
            profile_type,
            empresa_id: usuarioAtual.empresa_id,
            ativo: true,
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Convite reenviado com sucesso',
          reenvio: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Enviar convite usando admin client
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `https://easyestabilidade.com.br/set-password`,
        data: {
          nome,
          profile_type,
          empresa_id: usuarioAtual.empresa_id,
        }
      }
    );

    if (inviteError) {
      console.error('Erro ao enviar convite:', inviteError);
      throw new Error(`Erro ao enviar convite: ${inviteError.message}`);
    }

    console.log('Convite enviado com sucesso:', inviteData);

    // Criar registro na tabela usuarios
    const { data: novoUsuario, error: createError } = await supabase
      .from('usuarios')
      .insert({
        auth_id: inviteData.user?.id,
        nome,
        email,
        profile_type,
        empresa_id: usuarioAtual.empresa_id,
        ativo: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      throw new Error(`Erro ao criar usuário: ${createError.message}`);
    }

    console.log('Usuário criado:', novoUsuario);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        user: novoUsuario
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro na função invite-user:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});