import { useEffect } from 'react';

/**
 * Hook para sincronizar dados quando o app volta ao foco
 * Útil para PWAs que precisam atualizar dados quando o usuário retorna
 */
export const useAppSync = (onSync: () => void) => {
  useEffect(() => {
    let isInitialMount = true;
    
    // Sincronizar quando o app fica visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isInitialMount) {
        console.log('[AppSync] App voltou ao foco, sincronizando dados...');
        onSync();
      }
    };

    // Sincronizar quando a janela recebe foco
    const handleFocus = () => {
      if (!isInitialMount) {
        console.log('[AppSync] Janela recebeu foco, sincronizando dados...');
        onSync();
      }
    };

    // Registrar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Marcar que já passou do mount inicial
    isInitialMount = false;

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onSync]);
};
