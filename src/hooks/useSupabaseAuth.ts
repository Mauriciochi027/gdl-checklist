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
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as User;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Fetch profile immediately without setTimeout
          fetchUserProfile(currentSession.user.id).then(profile => {
            setUser(profile);
            if (isLoading) setIsLoading(false);
          });
        } else {
          setUser(null);
          if (isLoading) setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Profile is created automatically via trigger
        const userProfile = await fetchUserProfile(data.user.id);
        setUser(userProfile);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setIsLoading(false);
      return false;
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
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      setIsLoading(false);
      return false;
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
