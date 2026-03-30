import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Client } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Client | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthContext: Erro ao buscar perfil:', error);
        return;
      }
      
      if (data) {
        setProfile(data);
      } else if (userId && email) {
        // AUTO-CURA: Se o usuário existe no Auth mas não no banco (falha no signup), criamos agora.
        console.warn('AuthContext: Perfil não encontrado. Criando perfil padrão...');
        const baseName = email.split('@')[0];
        const { data: newProfile, error: createError } = await supabase
          .from('clients')
          .insert([{
            user_id: userId,
            username: `${baseName}_${Math.floor(Math.random() * 1000)}`, // Garante unicidade
            name: baseName,
            email: email,
            expiration_date: '',
            admin_id: localStorage.getItem('referralId') || null
          }])
          .select()
          .single();
        
        if (!createError && newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('AuthContext: Erro fatal ao buscar perfil:', err);
    }
  }, []);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      setIsAdmin(!!data);
    } catch (err) {
      console.error('AuthContext: Erro ao verificar admin:', err);
      setIsAdmin(false);
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
            // Executa em paralelo para ser mais rápido
            await Promise.all([
              fetchProfile(initialSession.user.id, initialSession.user.email),
              checkAdminStatus(initialSession.user.id)
            ]);
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
          await Promise.all([
            fetchProfile(newUser.id, newUser.email),
            checkAdminStatus(newUser.id)
          ]);
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
  }, [fetchProfile, checkAdminStatus]);

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
