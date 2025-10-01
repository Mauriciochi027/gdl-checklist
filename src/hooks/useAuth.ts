import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  username: string;
  name: string;
  profile: 'operador' | 'mecanico' | 'admin';
  matricula?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Função para inicializar usuários padrão
const initializeDefaultUsers = () => {
  const storedUsers = localStorage.getItem('checklist_users');
  const storedPasswords = localStorage.getItem('checklist_passwords');
  
  if (!storedUsers || !storedPasswords) {
    const defaultUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        name: 'Administrador',
        profile: 'admin',
        matricula: 'ADM001'
      },
      {
        id: '2',
        username: 'operador1',
        name: 'João Silva',
        profile: 'operador',
        matricula: 'OP001'
      },
      {
        id: '3',
        username: 'operador2',
        name: 'Maria Santos',
        profile: 'operador',
        matricula: 'OP002'
      },
      {
        id: '4',
        username: 'mecanico1',
        name: 'Carlos Oliveira',
        profile: 'mecanico',
        matricula: 'MEC001'
      },
      {
        id: '5',
        username: 'mecanico2',
        name: 'Ana Costa',
        profile: 'mecanico',
        matricula: 'MEC002'
      }
    ];

    const defaultPasswords: Record<string, string> = {
      'admin': 'admin123',
      'operador1': '123456',
      'operador2': '123456',
      'mecanico1': '123456',
      'mecanico2': '123456'
    };

    localStorage.setItem('checklist_users', JSON.stringify(defaultUsers));
    localStorage.setItem('checklist_passwords', JSON.stringify(defaultPasswords));
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
    
    // Inicializar usuários padrão se necessário
    initializeDefaultUsers();
    
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar usuários e senhas do localStorage
    const storedUsers = JSON.parse(localStorage.getItem('checklist_users') || '[]');
    const storedPasswords = JSON.parse(localStorage.getItem('checklist_passwords') || '{}');
    
    const user = storedUsers.find((u: User) => u.username === username);
    
    if (user && storedPasswords[username] === password) {
      setUser(user);
      localStorage.setItem('checklist_user', JSON.stringify(user));
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