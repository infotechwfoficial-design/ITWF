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

  const fetchProfile = useCallback(async (user: User) => {
    try {
      const isRoleAdmin = user.app_metadata?.role === 'admin';
      const prefersAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';

      // Define secure admin access straight from the JWT
      setIsAdmin(isRoleAdmin || prefersAdmin); 

      if (prefersAdmin || isRoleAdmin) {
        // 1. Tenta buscar na tabela de admins primeiro se houver preferência ou se for admin por JWT e preferir admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminError) {
          console.error('AuthContext: Erro ao buscar perfil de admin:', adminError);
        }

        if (adminData && prefersAdmin) {
          setProfile(adminData);
          return;
        }
      }

      // 2. Tenta buscar na tabela de clientes
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
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
          }
        } else {
          setProfile(clientData);
        }

        // Se encontrou como cliente, mas tem flag de admin perdida e não é admin real no JWT, vamos remover
        if (prefersAdmin && !isRoleAdmin) {
           localStorage.removeItem('isAdminAuthenticated');
        }
        return;
      }

      // 3. Se não achou cliente e é admin via JWT (mas não tinha preferência de login ainda), carrega o perfil admin padrão
      if (isRoleAdmin) {
        const { data: adminFallback, error: adminFallbackError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminFallback) {
          setProfile(adminFallback);
          localStorage.setItem('isAdminAuthenticated', 'true');
          return;
        }
      }

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
          setProfile(newProfile);
          if (!isRoleAdmin) {
            setIsAdmin(false);
          }
        }
      }
    } catch (err) {
      console.error('AuthContext: Erro fatal ao sincronizar perfil:', err);
    }
  }, []);

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

    // Inicialização da sessão
    const initSession = async () => {
      try {
        // Criamos um timeout na inicialização da Promise para que o PWA/Mobile 
        // nunca trave infinitamente na tela de "Carregando" caso a rede do OS fale ao acordar
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching session')), 15000)
        );
        const sessionPromise = supabase.auth.getSession();
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const initialSession = result?.data?.session;
        const sessionError = result?.error;
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession || null);
          const currentUser = initialSession?.user ?? null;
          setUser(currentUser);
          lastUserId.current = currentUser?.id ?? null;
          
          if (currentUser) {
            // Define o isAdmin imediatamente baseado no JWT para que o App.tsx rode o roteador sem erros
            const isRoleAdmin = currentUser.app_metadata?.role === 'admin';
            const prefersAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
            setIsAdmin(isRoleAdmin || prefersAdmin);
            
            // Busca o perfil de forma desvinculada (assíncrona pura) 
            // para DESTRAVAR o "Carregando" instantaneamente!
            fetchProfile(currentUser).catch(console.error);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthContext: Erro na inicialização:', err);
        // Em caso de catch (como travamento na volta de 2º plano), liberamos a UI assim mesmo e tentamos continuar
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listener de mudanças na auth (acionado frequentemente quando retorna do WhatsApp/etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('AuthContext: Auth event ->', _event);
      
      if (mounted) {
        const newUserId = newSession?.user?.id ?? null;
        const isUserDifferent = newUserId !== lastUserId.current;

        // Se o usuário mudou de fato, chamamos o bloqueio pesado
        if (isUserDifferent) {
          setLoading(true);
          lastUserId.current = newUserId;
        }

        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        
        if (newUser) {
          if (isUserDifferent) {
            // Bloqueio apenas se for uma pessoa DIFERENTE logando
            const isRoleAdmin = newUser.app_metadata?.role === 'admin';
            const prefersAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
            setIsAdmin(isRoleAdmin || prefersAdmin);
            await fetchProfile(newUser);
          } else {
            // Evita duplo fetch na inicialização da página
            if (_event !== 'INITIAL_SESSION') {
              // Atualização fantasma em background
              fetchProfile(newUser).catch(console.error);
            }
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          lastUserId.current = null;
        }
        
        // Garante liberação
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
