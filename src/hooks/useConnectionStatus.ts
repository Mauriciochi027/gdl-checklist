import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: Date | null;
  error: string | null;
}

/**
 * Lightweight connectivity check.
 * Uses auth.getSession() instead of querying a table — zero DB load.
 * Only polls when offline.
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isBackendReachable: true,
    lastChecked: null,
    error: null,
  });
  const checkingRef = useRef(false);

  const checkBackendConnection = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      // Use auth session check — no DB query needed
      const { error } = await supabase.auth.getSession();
      clearTimeout(timeout);

      setStatus(prev => ({
        ...prev,
        isBackendReachable: !error,
        lastChecked: new Date(),
        error: error ? error.message : null,
      }));
    } catch (err: any) {
      setStatus(prev => ({
        ...prev,
        isBackendReachable: false,
        lastChecked: new Date(),
        error: err.name === 'AbortError'
          ? 'Tempo limite excedido ao conectar ao servidor'
          : err.message || 'Erro de conexão desconhecido',
      }));
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    setStatus(prev => ({ ...prev, error: null }));
    checkBackendConnection();
  }, [checkBackendConnection]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      checkBackendConnection();
    };
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, isBackendReachable: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkBackendConnection();

    // Only poll when backend is unreachable (every 30s)
    const interval = setInterval(() => {
      if (!status.isBackendReachable) {
        checkBackendConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkBackendConnection, status.isBackendReachable]);

  return { ...status, retry };
};
