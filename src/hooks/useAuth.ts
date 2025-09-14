import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  username: string;
  name: string;
  profile: 'operador' | 'mecanico';
  matricula?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Usuários simulados para demonstração
const mockUsers: Record<string, { password: string; user: User }> = {
  'operador1': {
    password: '123456',
    user: {
      id: '1',
      username: 'operador1',
      name: 'João Silva',
      profile: 'operador',
      matricula: 'OP001'
    }
  },
  'operador2': {
    password: '123456',
    user: {
      id: '2',
      username: 'operador2',
      name: 'Maria Santos',
      profile: 'operador',
      matricula: 'OP002'
    }
  },
  'mecanico1': {
    password: '123456',
    user: {
      id: '3',
      username: 'mecanico1',
      name: 'Carlos Oliveira',
      profile: 'mecanico',
      matricula: 'MEC001'
    }
  },
  'mecanico2': {
    password: '123456',
    user: {
      id: '4',
      username: 'mecanico2',
      name: 'Ana Costa',
      profile: 'mecanico',
      matricula: 'MEC002'
    }
  }
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe usuário logado no localStorage
    const storedUser = localStorage.getItem('checklist_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('checklist_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData = mockUsers[username];
    if (userData && userData.password === password) {
      setUser(userData.user);
      localStorage.setItem('checklist_user', JSON.stringify(userData.user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('checklist_user');
  };

  return {
    user,
    login,
    logout,
    isLoading
  };
};