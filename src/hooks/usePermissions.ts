import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useSupabaseAuth';
import { QUERY_KEYS, CACHE_TIMES } from '@/lib/queryConfig';

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

const getDefaultPermissionsByProfile = (profile: string): Permission[] => {
  const defaults: Record<string, Permission[]> = {
    operador: ['dashboard', 'checklist', 'history', 'status'],
    mecanico: ['dashboard', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history'],
    gestor: ['dashboard', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history'],
    admin: ['dashboard', 'users', 'status', 'equipments', 'equipment-management', 'checklist', 'approvals', 'history', 'tires'],
  };
  return defaults[profile] || ['dashboard'];
};

export const usePermissions = (user: User | null): UserPermissions => {
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.permissions(user?.id || ''),
    queryFn: async (): Promise<Permission[]> => {
      if (!user) return [];
      // Admin gets all permissions without DB query
      if (user.profile === 'admin') {
        return getDefaultPermissionsByProfile('admin');
      }

      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading permissions:', error);
        return getDefaultPermissionsByProfile(user.profile);
      }

      const configuredPerms = data?.map(p => p.permission) || [];
      return (configuredPerms.length > 0 ? configuredPerms : getDefaultPermissionsByProfile(user.profile)) as Permission[];
    },
    enabled: !!user,
    ...CACHE_TIMES.permissions,
  });

  // Realtime subscription for permission changes (skip for admin)
  useEffect(() => {
    if (!user || user.profile === 'admin') return;

    const channel = supabase
      .channel(`permissions-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_permissions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions(user.id) });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, user?.profile, queryClient]);

  const canAccess = useCallback((permission: Permission): boolean => {
    if (user?.profile === 'admin') return true;
    return permissions.includes(permission);
  }, [user?.profile, permissions]);

  const canEdit = useCallback((resource: string): boolean => {
    if (!user) return false;
    if (user.profile === 'admin') return true;
    if (user.profile === 'gestor') return ['equipments', 'status', 'equipment-management'].includes(resource);
    if (user.profile === 'mecanico') return ['status'].includes(resource);
    return false;
  }, [user]);

  const canDelete = useCallback((_resource: string): boolean => {
    return user?.profile === 'admin';
  }, [user?.profile]);

  return { permissions, isLoading, canAccess, canEdit, canDelete };
};
