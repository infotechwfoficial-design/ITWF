import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Client, Admin } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Client | Admin | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Client | Admin | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Usamos ref para rastrear o ID de usuário atual e evitar problemas com "closures" obsoletas.
  const lastUserId = useRef<string | null>(null);

  // Sistema de Log de Diagnóstico para o PWA
  const addAuthLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`AuthDiag: ${message}`);
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('itwf_auth_logs') || '[]');
      const updatedLogs = [logEntry, ...existingLogs].slice(0, 50); // Mantém apenas os últimos 50 logs
      localStorage.setItem('itwf_auth_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn('Erro ao salvar logs de diagnóstico:', e);
    }
  }, []);

  const fetchProfile = useCallback(async (user: User) => {
    addAuthLog(`Iniciando busca de perfil para user_id: ${user.id}`);
    try {
      const isRoleAdmin = user.app_metadata?.role === 'admin';
      const prefersAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';

      addAuthLog(`Configurações: isRoleAdmin=${isRoleAdmin}, prefersAdmin=${prefersAdmin}`);
      setIsAdmin(isRoleAdmin || prefersAdmin); 

      if (prefersAdmin || isRoleAdmin) {
        // 1. Tenta buscar na tabela de admins primeiro if houver preferência ou se for admin por JWT e preferir admin
        addAuthLog('Buscando na tabela de admins...');
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminError) {
          addAuthLog(`Erro ao buscar admin: ${adminError.message}`);
          console.error('AuthContext: Erro ao buscar perfil de admin:', adminError);
        }

        if (adminData && prefersAdmin) {
          addAuthLog('Perfil de Admin encontrado e carregado.');
          setProfile(adminData);
          return;
        }
      }

      addAuthLog('Buscando na tabela de clientes...');
      // 2. Tenta buscar na tabela de clientes
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        addAuthLog(`Erro ao buscar cliente: ${clientError.message}`);
        console.error('AuthContext: Erro ao buscar perfil de cliente:', clientError);
      }
      
      if (clientData) {
        // Se for cliente, busca também o branding do administrador dele
        if (clientData.admin_id) {
          const { data: adminBranding } = await supabase
            .from('admins')
            .select('support_number, push_logo_url, name')
            .eq('id', clientData.admin_id)
            .maybeSingle();

          if (adminBranding) {
            // Unifica as informações de suporte/logo do admin no perfil do cliente
            setProfile({
              ...clientData,
              support_number: adminBranding.support_number || clientData.support_number,
              push_logo_url: adminBranding.push_logo_url
            } as Client);
          } else {
            setProfile(clientData);
            addAuthLog('Perfil de Cliente carregado (sem branding admin).');
          }
        } else {
          setProfile(clientData);
          addAuthLog('Perfil de Cliente carregado (sem admin_id).');
        }

        // Se encontrou como cliente, mas tem flag de admin perdida e não é admin real no JWT, vamos remover
        if (prefersAdmin && !isRoleAdmin) {
           localStorage.removeItem('isAdminAuthenticated');
        }
        return;
      }

      // 3. Se não achou cliente e é admin via JWT (mas não tinha preferência de login ainda), carrega o perfil admin padrão
      if (isRoleAdmin) {
        const { data: adminFallback } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminFallback) {
          addAuthLog('Perfil de Admin encontrado via Fallback.');
          setProfile(adminFallback as Admin);
          localStorage.setItem('isAdminAuthenticated', 'true');
          return;
        }
      }

      addAuthLog('Perfil não encontrado em nenhuma tabela.');
      // 4. AUTO-CURA (Apenas para Clientes): Se não encontrou em nenhum lugar e é um novo usuário
      if (user.id && user.email) {
        console.warn('AuthContext: Perfil não encontrado. Criando perfil de cliente padrão...');
        const baseName = user.email.split('@')[0];
        const { data: newProfile, error: createError } = await supabase
          .from('clients')
          .insert([{
            user_id: user.id,
            username: `${baseName}_${Math.floor(Math.random() * 1000)}`,
            name: baseName,
            email: user.email,
            expiration_date: '',
            admin_id: localStorage.getItem('referralId') || null
          }])
          .select()
          .single();
        
        if (!createError && newProfile) {
          addAuthLog('Perfil de Auto-Cura (Cliente) criado com sucesso.');
          setProfile(newProfile as Client);
          if (!isRoleAdmin) {
            setIsAdmin(false);
          }
        } else if (createError) {
          addAuthLog(`Erro na Auto-Cura: ${createError.message}`);
        }
      }
    } catch (err: any) {
      addAuthLog(`Erro fatal no fetchProfile: ${err.message}`);
      console.error('AuthContext: Erro fatal ao sincronizar perfil:', err);
    }
  }, [addAuthLog]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    lastUserId.current = null;
  };

  useEffect(() => {
    let mounted = true;
    addAuthLog('AuthProvider iniciado/montado.');

    // KICKSTART: Chute inicial de 3 segundos para garantir que o PWA nunca trave
    const kickstartSession = async () => {
      addAuthLog('Executando Kickstart de sessão manual...');
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted && initialSession) {
          addAuthLog(`Kickstart: Sessão encontrada para ${initialSession.user.email}`);
          setUser(initialSession.user);
          setSession(initialSession);
          await fetchProfile(initialSession.user);
        } else {
          addAuthLog('Kickstart: Nenhuma sessão imediata encontrada.');
        }
      } catch (err: any) {
        addAuthLog(`Erro no Kickstart: ${err.message}`);
      } finally {
        // O timer de 3s é o soberano para destravar o loading
      }
    };

    // FAIL-SAFE: O soberano sistema de 3 segundos que funcionava perfeitamente
    const loadingTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        addAuthLog('Sessão Destravada pelo Timer de 3 segundos (Fail-Safe).');
      }
    }, 3000);

    // Proteção Extra: Se após 8 segundos nada aconteceu (raríssimo), damos um último empurrão
    const emergencyTimer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        addAuthLog('TRIGGER DE EMERGÊNCIA: Destravando após 8 segundos.');
      }
    }, 8000);

    kickstartSession();

    // Listener para eventos em tempo real (Login, Logout, Expiração de Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      // Pequeno atraso para o INITIAL_SESSION não atropelar o Kickstart se ambos vierem juntos
      if (_event === 'INITIAL_SESSION') {
        await new Promise(r => setTimeout(r, 100));
      }
      
      addAuthLog(`Evento Auth recebido: ${_event}`);
      
      if (!mounted) {
        addAuthLog('Evento ignorado: Componente desmontado.');
        return;
      }

      const newUser = newSession?.user ?? null;
      
      // Se for INITIAL_SESSION, o Kickstart já pode ter lidado com isso,
      // mas o listener é o canal oficial de sincronização do Supabase.
      setSession(newSession);
      setUser(newUser);
      
      if (newUser) {
        const isUserDifferent = newUser.id !== lastUserId.current;
        addAuthLog(`Usuário logado: ${newUser.email} (Diferente do anterior: ${isUserDifferent})`);

        if (isUserDifferent) {
          lastUserId.current = newUser.id;
          try {
            await fetchProfile(newUser);
          } catch (err: any) {
            addAuthLog(`Erro no listener fetchProfile: ${err.message}`);
          } finally {
            if (mounted) {
              setLoading(false);
              addAuthLog('Carregamento finalizado via Listener.');
            }
          }
        } else {
          if (_event !== 'INITIAL_SESSION') {
            fetchProfile(newUser).catch(err => addAuthLog(`Erro silencioso: ${err.message}`));
          } else {
             if (mounted) {
               setLoading(false);
               addAuthLog('Carregamento finalizado - Sessão Inicial Confirmada.');
             }
          }
        }
      } else {
        addAuthLog('Nenhum usuário logado detectado pelo listener.');
        setProfile(null);
        setIsAdmin(false);
        lastUserId.current = null;
        if (mounted) {
          setLoading(false);
          addAuthLog('Carregamento finalizado - Modo Visitante.');
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimer);
      addAuthLog('AuthProvider desmontado.');
      subscription.unsubscribe();
    };
  }, [fetchProfile, addAuthLog]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
