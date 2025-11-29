import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
  isAuthReady: boolean;
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
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Fetch user profile from database - MEMOIZADO para evitar loops
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
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
  }, []);

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
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (!mounted) return;
        
        console.log('[useAuth] Sessão encontrada:', !!currentSession);
        
        // Validar se a sessão não está expirada
        if (currentSession?.expires_at) {
          const expiresAt = currentSession.expires_at * 1000;
          const now = Date.now();
          
          if (expiresAt < now) {
            console.log('[useAuth] Sessão expirada, fazendo logout...');
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
              setIsLoading(false);
            }
            return;
          }
        }
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setUser(profile);
            setIsLoading(false);
            setIsAuthReady(true);
          }
        } else {
          if (mounted) {
            setIsLoading(false);
            setIsAuthReady(true);
          }
        }
      } catch (error) {
        console.error('[useAuth] Erro inesperado ao inicializar:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener AFTER initial check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[useAuth] Auth state changed:', event);
        
        // Atualizar sessão e user imediatamente de forma síncrona
        setSession(currentSession);
        
        if (currentSession?.user && event !== 'TOKEN_REFRESHED') {
          // Buscar perfil de forma assíncrona usando setTimeout para evitar deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id).then(profile => {
                if (mounted) {
                  setUser(profile);
                }
              });
            }
          }, 0);
        } else if (!currentSession) {
          // Logout ou sessão removida
          setUser(null);
        }
      }
    );

    return () => {
      console.log('[useAuth] Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Removendo fetchUserProfile das dependências para evitar loops

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
    try {
      console.log('[useAuth] Iniciando logout...');
      
      // Limpar estado imediatamente para evitar loops
      setUser(null);
      setSession(null);
      
      // Fazer signout no Supabase
      await supabase.auth.signOut();
      
      // Limpar cache do localStorage (se houver dados adicionais)
      // O Supabase já limpa automaticamente suas chaves de auth
      console.log('[useAuth] Logout concluído com sucesso');
    } catch (error) {
      console.error('[useAuth] Erro ao fazer logout:', error);
      // Mesmo com erro, garantir que o estado está limpo
      setUser(null);
      setSession(null);
    }
  };

  return {
    user,
    session,
    login,
    signup,
    logout,
    isLoading,
    isAuthReady
  };
};
