/**
 * Utilitários de formatação reutilizáveis
 */

/**
 * Formata uma data no padrão brasileiro
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata uma hora no padrão brasileiro (HH:mm)
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Formata data e hora no padrão brasileiro
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} às ${formatTime(date)}`;
};

/**
 * Formata duração em minutos para texto legível
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Formata número com separador de milhares
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

/**
 * Formata porcentagem
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formata valor monetário no padrão brasileiro (R$)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
