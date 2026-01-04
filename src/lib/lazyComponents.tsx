import React, { lazy } from 'react';

/**
 * Lazy loading de componentes pesados para melhor performance inicial
 * Carrega componentes apenas quando necessário
 */

// Páginas principais
export const LazyUserManagement = lazy(() => 
  import('@/components/UserManagement').then(module => ({
    default: module.default
  }))
);

export const LazyEquipmentManagement = lazy(() => 
  import('@/components/EquipmentManagement').then(module => ({
    default: module.default
  }))
);

export const LazyChecklistHistory = lazy(() => 
  import('@/components/ChecklistHistory').then(module => ({
    default: module.default
  }))
);

export const LazyApprovalsPage = lazy(() => 
  import('@/components/ApprovalsPage').then(module => ({
    default: module.default
  }))
);

export const LazyChecklistForm = lazy(() => 
  import('@/components/ChecklistForm').then(module => ({
    default: module.default
  }))
);

export const LazyTireManagement = lazy(() => 
  import('@/components/TireManagement').then(module => ({
    default: module.default
  }))
);

/**
 * Fallback padrão para lazy components
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);
