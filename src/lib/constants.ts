/**
 * Constantes da aplicação centralizadas
 */

// IDs dos itens críticos que podem paralisar o equipamento
export const CRITICAL_CHECKLIST_ITEMS = ['4', '5', '7', '11'] as const;

// Perfis de usuário
export const USER_PROFILES = {
  OPERADOR: 'operador',
  MECANICO: 'mecanico',
  GESTOR: 'gestor',
  ADMIN: 'admin'
} as const;

// Status de checklist
export const CHECKLIST_STATUS = {
  CONFORME: 'conforme',
  PENDENTE: 'pendente',
  NEGADO: 'negado'
} as const;

// Status de equipamento
export const EQUIPMENT_STATUS = {
  DISPONIVEL: 'disponivel',
  OPERANDO: 'operando',
  MANUTENCAO: 'manutencao'
} as const;

// Tipos de resposta no checklist
export const ANSWER_VALUES = {
  SIM: 'sim',
  NAO: 'nao',
  NAO_APLICA: 'nao_aplica'
} as const;

// Unidades
export const UNITS = {
  PRINCIPAL: '01',
  SECUNDARIA: '02',
  TERCIARIA: '03'
} as const;

// Configurações de QR Code
export const QR_CODE_CONFIG = {
  MAX_SCAN_ATTEMPTS: 10,
  SCAN_RETRY_DELAY: 1000,
  VIDEO_CONSTRAINTS: {
    WIDTH_IDEAL: 1280,
    WIDTH_MAX: 1920,
    HEIGHT_IDEAL: 720,
    HEIGHT_MAX: 1080
  }
} as const;

// Configurações de assinatura
export const SIGNATURE_CONFIG = {
  LINE_WIDTH: 2,
  LINE_CAP: 'round' as CanvasLineCap,
  STROKE_STYLE: '#1f2937',
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 200
} as const;
