import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useSupabaseAuth';

export type Permission = 
  | 'dashboard'
  | 'checklist'
  | 'history'
  | 'status'
  | 'approvals'
  | 'equipments'
  | 'equipment-management'
  | 'users'
  | 'tires';

interface UserPermissions {
  permissions: Permission[];
  isLoading: boolean;
  canAccess: (permission: Permission) => boolean;
  canEdit: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
}

/**
 * Hook para gerenciar permissões de usuário
 * Carrega permissões da tabela user_permissions e respeita o perfil base
 */
export const usePermissions = (user: User | null): UserPermissions => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        // Admin tem acesso total sempre
        if (user.profile === 'admin') {
          setPermissions([
            'dashboard',
            'users',
            'status',
            'equipments',
            'equipment-management',
            'checklist',
            'approvals',
            'history',
            'tires'
          ]);
          setIsLoading(false);
          return;
        }

        // Carregar permissões específicas do usuário
        const { data, error } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading permissions:', error);
          // Fallback para permissões básicas baseadas no perfil
          setPermissions(getDefaultPermissionsByProfile(user.profile));
        } else {
          // Usar permissões configuradas ou padrão do perfil se não houver nenhuma
          const configuredPerms = data?.map(p => p.permission) || [];
          const userPerms = configuredPerms.length > 0 
            ? configuredPerms 
            : getDefaultPermissionsByProfile(user.profile);
          setPermissions(userPerms as Permission[]);
        }
      } catch (error) {
        console.error('Error in loadPermissions:', error);
        setPermissions(getDefaultPermissionsByProfile(user.profile));
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('user_permissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_permissions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadPermissions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, user?.profile]);

  const canAccess = (permission: Permission): boolean => {
    // Admin pode tudo
    if (user?.profile === 'admin') return true;
    
    // Verificar permissão específica
    return permissions.includes(permission);
  };

  const canEdit = (resource: string): boolean => {
    if (!user) return false;
    
    // Admin pode editar tudo
    if (user.profile === 'admin') return true;
    
    // Gestor pode editar equipamentos e status
    if (user.profile === 'gestor') {
      return ['equipments', 'status', 'equipment-management'].includes(resource);
    }
    
    // Mecânico pode editar status de equipamentos
    if (user.profile === 'mecanico') {
      return ['status'].includes(resource);
    }
    
    return false;
  };

  const canDelete = (resource: string): boolean => {
    // Apenas admin pode deletar
    return user?.profile === 'admin';
  };

  return {
    permissions,
    isLoading,
    canAccess,
    canEdit,
    canDelete
  };
};

/**
 * Permissões padrão baseadas no perfil (fallback)
 */
const getDefaultPermissionsByProfile = (profile: string): Permission[] => {
  const defaults: Record<string, Permission[]> = {
    operador: ['dashboard', 'checklist', 'history', 'status'],
    mecanico: ['dashboard', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history'],
    gestor: ['dashboard', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history'],
    admin: ['dashboard', 'users', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history', 'tires']
  };

  return defaults[profile] || ['dashboard'];
};
