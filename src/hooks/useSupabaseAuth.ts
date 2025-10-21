import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  name: string;
  profile: 'operador' | 'mecanico' | 'gestor' | 'admin';
  matricula?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, name: string, profile: 'operador' | 'mecanico' | 'gestor' | 'admin', matricula?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useSupabaseAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('[useAuth] Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useAuth] Erro ao buscar perfil:', error);
        return null;
      }

      if (data) {
        console.log('[useAuth] Perfil encontrado:', data);
        return data as User;
      }

      console.log('[useAuth] Nenhum perfil encontrado');
      return null;
    } catch (error) {
      console.error('[useAuth] Erro inesperado ao buscar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[useAuth] Inicializando hook de autenticação');

    // Check for existing session FIRST
    const initAuth = async () => {
      try {
        console.log('[useAuth] Verificando sessão existente...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useAuth] Erro ao obter sessão:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (!mounted) return;
        
        console.log('[useAuth] Sessão encontrada:', !!currentSession);
        setSession(currentSession);
        
        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[useAuth] Erro inesperado ao inicializar:', error);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener AFTER initial check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[useAuth] Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      console.log('[useAuth] Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (
    username: string, 
    password: string, 
    name: string, 
    profile: 'operador' | 'mecanico' | 'gestor' | 'admin',
    matricula?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Create auth user with email format (username@domain.com)
      const email = `${username}@gdl.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name,
            profile,
            matricula
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return false;
      }

      if (data.user) {
        // Profile is created automatically via trigger
        const userProfile = await fetchUserProfile(data.user.id);
        setUser(userProfile);
      }

      return true;
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Convert username to email format
      const email = `${username}@gdl.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
      }

      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return {
    user,
    session,
    login,
    signup,
    logout,
    isLoading
  };
};
