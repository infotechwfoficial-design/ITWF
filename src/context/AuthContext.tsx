import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      // 1. Tenta buscar na tabela de clientes
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
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
        setIsAdmin(false);
        return;
      }

      // 2. Se não for cliente, tenta buscar na tabela de admins
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminError) {
        console.error('AuthContext: Erro ao buscar perfil de admin:', adminError);
      }

      if (adminData) {
        setProfile(adminData);
        setIsAdmin(true);
        return;
      }

      // 3. AUTO-CURA (Apenas para Clientes): Se não encontrou em nenhum lugar e é um novo usuário
      if (userId && email) {
        console.warn('AuthContext: Perfil não encontrado. Criando perfil de cliente padrão...');
        const baseName = email.split('@')[0];
        const { data: newProfile, error: createError } = await supabase
          .from('clients')
          .insert([{
            user_id: userId,
            username: `${baseName}_${Math.floor(Math.random() * 1000)}`,
            name: baseName,
            email: email,
            expiration_date: '',
            admin_id: localStorage.getItem('referralId') || null
          }])
          .select()
          .single();
        
        if (!createError && newProfile) {
          setProfile(newProfile);
          setIsAdmin(false);
        }
      }
    } catch (err) {
      console.error('AuthContext: Erro fatal ao sincronizar perfil:', err);
    }
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    let mounted = true;

    // Inicialização da sessão
    const initSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id, initialSession.user.email);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthContext: Erro na inicialização:', err);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listener de mudanças na auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('AuthContext: Auth event ->', _event);
      
      if (mounted) {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        
        if (newUser) {
          await fetchProfile(newUser.id, newUser.email);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
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
