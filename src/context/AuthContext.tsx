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
        addAuthLog('Iniciando Auto-Cura para novo usuário...');
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
          console.error('AuthContext: Falha na auto-cura:', createError);
        }
      }
    } catch (err: any) {
      addAuthLog(`Erro fatal no fetchProfile: ${err.message}`);
      console.error('AuthContext: Erro fatal ao sincronizar perfil:', err);
    } finally {
      // Garantimos que o loading local do Dashboard (se houver) ou do App saiba que a tentativa terminou
      addAuthLog('Finalizada tentativa de busca de perfil.');
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

    // Inicialização Atômica: Um único fluxo para checar sessão + perfil
    const initializeAuth = async () => {
      try {
        addAuthLog('Iniciando verificação de sessão inicial...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          addAuthLog(`Sessão encontrada: ${initialSession.user.email}. Buscando perfil...`);
          setSession(initialSession);
          setUser(initialSession.user);
          lastUserId.current = initialSession.user.id;
          
          // Esperamos o perfil carregar ANTES de liberar o loading
          await fetchProfile(initialSession.user);
        } else {
          addAuthLog('Nenhuma sessão inicial encontrada.');
        }
      } catch (err: any) {
        addAuthLog(`Erro na inicialização: ${err.message}`);
      } finally {
        if (mounted) {
          setLoading(false);
          addAuthLog('Carregamento inicial finalizado.');
        }
      }
    };

    // FAIL-SAFE DE SEGURANÇA (Apenas para casos extremos de rede travada)
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        addAuthLog('Safety Timeout: Carregamento forçado após 10s.');
      }
    }, 10000);

    initializeAuth();

    // Listener para eventos em tempo real (Login, Logout, Expiração de Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      addAuthLog(`Evento Auth recebido: ${_event}`);
      
      if (!mounted) return;

      const newUser = newSession?.user ?? null;
      setSession(newSession);
      setUser(newUser);
      
      if (newUser) {
        const isUserDifferent = newUser.id !== lastUserId.current;
        if (isUserDifferent || !profile) {
          lastUserId.current = newUser.id;
          addAuthLog(`Sincronizando perfil para o evento ${_event}...`);
          try {
            await fetchProfile(newUser);
          } finally {
            if (mounted) setLoading(false);
          }
        } else {
          if (mounted) setLoading(false);
        }
      } else {
        // Logout ou Sessão Expirada
        if (lastUserId.current !== null) {
          addAuthLog('Limpando dados de perfil (Logout detectado).');
          setProfile(null);
          setIsAdmin(false);
          lastUserId.current = null;
        }
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      addAuthLog('AuthProvider desmontado.');
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
