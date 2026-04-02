import { useEffect, useRef } from 'react';

/**
 * Hook para sincronizar dados quando o app volta ao foco.
 * Uses only visibilitychange (not both focus + visibility to avoid double-firing).
 * Debounces to prevent rapid repeated syncs.
 */
export const useAppSync = (onSync: () => void) => {
  const lastSyncRef = useRef(0);

  useEffect(() => {
    let isInitialMount = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isInitialMount) {
        const now = Date.now();
        // Debounce: skip if synced less than 10s ago
        if (now - lastSyncRef.current < 10000) return;
        lastSyncRef.current = now;
        console.log('[AppSync] App voltou ao foco, sincronizando dados...');
        onSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    isInitialMount = false;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onSync]);
};
