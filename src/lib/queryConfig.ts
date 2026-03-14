/**
 * Centralized query configuration and performance monitoring
 * Provides consistent cache settings, abort controllers, and timing logs
 */

// ==================== Query Keys ====================
export const QUERY_KEYS = {
  equipment: ['equipment'] as const,
  equipmentLight: ['equipment-light'] as const,
  checklists: ['checklists'] as const,
  tires: ['tires'] as const,
  permissions: (userId: string) => ['permissions', userId] as const,
  tireMeasurements: (tireId: string) => ['tire-measurements', tireId] as const,
} as const;

// ==================== Cache Timings ====================
export const CACHE_TIMES = {
  /** Equipment data changes rarely - long cache */
  equipment: { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 },
  /** Checklists change more frequently */
  checklists: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  /** Permissions almost never change */
  permissions: { staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000 },
  /** Tires change moderately */
  tires: { staleTime: 3 * 60 * 1000, gcTime: 10 * 60 * 1000 },
} as const;

// ==================== Light columns (exclude heavy fields) ====================
/** Equipment columns without photo (base64 can be huge) */
export const EQUIPMENT_LIGHT_COLUMNS = 
  'id,code,brand,model,sector,status,year,observations,operator_name,operator_id,location,unit,equipment_series,equipment_number,hour_meter,cost_center,business_unit,last_check,next_maintenance,last_checklist_id,last_operation_start,created_at,updated_at';

/** Checklist record columns - already lightweight */
export const CHECKLIST_LIGHT_COLUMNS = 
  'id,equipment_code,equipment_model,operator_name,operator_id,status,total_items,conforme_items,nao_conforme_items,has_critical_issues,hour_meter,timestamp,checklist_type,location,unit,equipment_series,equipment_number,equipment_id,equipment_model_type';

// ==================== Performance Monitoring ====================
const SLOW_QUERY_THRESHOLD_MS = 500;

export const withTiming = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const elapsed = Math.round(performance.now() - start);
    if (elapsed > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[⚠️ Slow Query] ${label}: ${elapsed}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`);
    } else {
      console.log(`[Query] ${label}: ${elapsed}ms`);
    }
    return result;
  } catch (error) {
    const elapsed = Math.round(performance.now() - start);
    console.error(`[Query Error] ${label}: ${elapsed}ms`, error);
    throw error;
  }
};

// ==================== Abort Controller Factory ====================
const activeControllers = new Map<string, AbortController>();

export const getAbortSignal = (key: string, timeoutMs = 15000): AbortSignal => {
  // Cancel previous request with same key
  const existing = activeControllers.get(key);
  if (existing) {
    existing.abort();
  }
  
  const controller = new AbortController();
  activeControllers.set(key, controller);
  
  // Auto-timeout
  const timeout = setTimeout(() => {
    controller.abort();
    activeControllers.delete(key);
  }, timeoutMs);
  
  // Cleanup on abort
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeout);
    activeControllers.delete(key);
  }, { once: true });
  
  return controller.signal;
};

export const clearAbortController = (key: string) => {
  const controller = activeControllers.get(key);
  if (controller) {
    activeControllers.delete(key);
  }
};

// ==================== Retry Configuration ====================
export const RETRY_CONFIG = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
} as const;
