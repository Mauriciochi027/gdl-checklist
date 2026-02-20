import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: Date | null;
  error: string | null;
}

/**
 * Hook para detectar problemas de conectividade com o backend.
 * Útil para redes Wi-Fi com firewall/proxy que bloqueiam requisições.
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
      // Tenta uma query leve para verificar conectividade com o backend
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (error) {
        // Erros de RLS ou auth não são problemas de conectividade
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          setStatus(prev => ({
            ...prev,
            isBackendReachable: true,
            lastChecked: new Date(),
            error: null,
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            isBackendReachable: false,
            lastChecked: new Date(),
            error: error.message,
          }));
        }
      } else {
        setStatus(prev => ({
          ...prev,
          isBackendReachable: true,
          lastChecked: new Date(),
          error: null,
        }));
      }
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError'
        ? 'Tempo limite excedido ao conectar ao servidor'
        : err.message || 'Erro de conexão desconhecido';

      setStatus(prev => ({
        ...prev,
        isBackendReachable: false,
        lastChecked: new Date(),
        error: errorMsg,
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

    // Verificar conectividade na montagem
    checkBackendConnection();

    // Verificar periodicamente a cada 30s se estiver offline do backend
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
