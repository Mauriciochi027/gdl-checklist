import { USER_PROFILES } from './constants';

/**
 * Sistema de permissões centralizado
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
 * Verifica se o usuário pode gerenciar equipamentos
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
  return ['mecanico', 'admin'].includes(profile);
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
 * Retorna as páginas disponíveis para o perfil do usuário
 */
export const getAvailablePages = (profile?: UserProfile): string[] => {
  if (!profile) return ['dashboard'];
  
  const basePages = ['dashboard', 'checklist', 'history'];
  
  switch (profile) {
    case 'admin':
      return [...basePages, 'users', 'status', 'approvals', 'equipments', 'equipment-management'];
    case 'gestor':
      return [...basePages, 'status', 'approvals', 'equipments', 'equipment-management'];
    case 'mecanico':
      return [...basePages, 'status', 'approvals'];
    case 'operador':
      return basePages;
    default:
      return basePages;
  }
};
