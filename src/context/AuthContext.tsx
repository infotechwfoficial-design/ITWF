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
  const lastUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (user: User) => {
    try {
      const isRoleAdmin = user.app_metadata?.role === 'admin';
      const prefersAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
      
      setIsAdmin(isRoleAdmin || prefersAdmin);

      // Prioridade para busca de Admin se houver indicação
      if (prefersAdmin || isRoleAdmin) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData && (prefersAdmin || isRoleAdmin)) {
          setProfile(adminData);
          return;
        }
      }

      // Busca padrão como Cliente
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientData) {
        // Se for cliente, tenta buscar branding do admin associado
        if (clientData.admin_id) {
          const { data: adminBranding } = await supabase
            .from('admins')
            .select('support_number, push_logo_url, name')
            .eq('id', clientData.admin_id)
            .maybeSingle();

          if (adminBranding) {
            setProfile({
              ...clientData,
              support_number: adminBranding.support_number || clientData.support_number,
              push_logo_url: adminBranding.push_logo_url,
              admin_name: adminBranding.name
            } as Client);
          } else {
            setProfile(clientData);
          }
        } else {
          setProfile(clientData);
        }
        
        // Limpa flag de admin se logado como cliente
        if (!isRoleAdmin && prefersAdmin) {
          localStorage.removeItem('isAdminAuthenticated');
        }
      } else {
        // Se não achou perfil, marcamos como null
        // A criação (Auto-Cura) agora será responsabilidade das páginas de Login/Signup
        setProfile(null);
      }
    } catch (err) {
      console.error('AuthContext: Erro ao carregar perfil:', err);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    lastUserId.current = null;
    localStorage.removeItem('isAdminAuthenticated');
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          lastUserId.current = initialSession.user.id;
          await fetchProfile(initialSession.user);
        }
      } catch (err) {
        console.error('AuthContext Init Error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      const newUser = newSession?.user ?? null;
      setSession(newSession);
      setUser(newUser);

      if (newUser) {
        if (newUser.id !== lastUserId.current || !profile) {
          lastUserId.current = newUser.id;
          await fetchProfile(newUser);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        lastUserId.current = null;
      }
      setLoading(false);
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
