import React from 'react';
import { AuthContext, useSupabaseAuthState } from '@/hooks/useSupabaseAuth';
import { usePrefetchData } from '@/hooks/usePrefetchData';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useSupabaseAuthState();
  
  // Prefetch critical data as soon as user is authenticated
  usePrefetchData(auth.user?.id);
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};