/**
 * Sistema de permissões centralizado baseado em perfil
 * 
 * IMPORTANTE: Este arquivo contém verificações de permissões baseadas em PERFIL.
 * Para permissões granulares por usuário, use o hook usePermissions.
 */

type UserProfile = 'operador' | 'mecanico' | 'gestor' | 'admin';

/**
 * Verifica se o usuário pode aprovar checklists
 */
export const canApproveChecklists = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return ['mecanico', 'gestor', 'admin'].includes(profile);
};

/**
 * Verifica se o usuário pode gerenciar equipamentos (adicionar/editar)
 */
export const canManageEquipment = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return ['gestor', 'admin'].includes(profile);
};

/**
 * Verifica se o usuário pode mudar status de equipamentos
 */
export const canEditEquipmentStatus = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return ['mecanico', 'gestor', 'admin'].includes(profile);
};

/**
 * Verifica se o usuário pode gerenciar usuários
 */
export const canManageUsers = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return profile === 'admin';
};

/**
 * Verifica se o usuário pode ver todos os checklists
 */
export const canViewAllChecklists = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return profile !== 'operador';
};

/**
 * Verifica se o usuário pode deletar registros
 */
export const canDeleteRecords = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return profile === 'admin';
};

/**
 * Verifica se o usuário pode rejeitar checklists
 */
export const canRejectChecklists = (profile?: UserProfile): boolean => {
  if (!profile) return false;
  return ['mecanico', 'gestor', 'admin'].includes(profile);
};
