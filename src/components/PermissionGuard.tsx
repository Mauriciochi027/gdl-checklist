import { ReactNode } from 'react';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

/**
 * Componente para proteger conteúdo baseado em permissões
 */
export const PermissionGuard = ({ 
  children, 
  permission, 
  fallback 
}: PermissionGuardProps) => {
  const { user } = useAuth();
  const { canAccess, isLoading } = usePermissions(user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canAccess(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar este conteúdo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

interface EditGuardProps {
  children: ReactNode;
  resource: string;
  fallback?: ReactNode;
}

/**
 * Componente para proteger ações de edição
 */
export const EditGuard = ({ 
  children, 
  resource, 
  fallback 
}: EditGuardProps) => {
  const { user } = useAuth();
  const { canEdit } = usePermissions(user);

  if (!canEdit(resource)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface DeleteGuardProps {
  children: ReactNode;
  resource: string;
  fallback?: ReactNode;
}

/**
 * Componente para proteger ações de exclusão
 */
export const DeleteGuard = ({ 
  children, 
  resource, 
  fallback 
}: DeleteGuardProps) => {
  const { user } = useAuth();
  const { canDelete } = usePermissions(user);

  if (!canDelete(resource)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
