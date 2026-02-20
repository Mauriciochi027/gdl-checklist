import { WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useState } from 'react';

/**
 * Banner que aparece quando há problemas de conexão com o backend
 */
export const ConnectionBanner = () => {
  const { isOnline, isBackendReachable, retry, error } = useConnectionStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    retry();
    // Recarrega os dados da página
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 2000);
  };

  if (isOnline && isBackendReachable) return null;

  const message = !isOnline
    ? 'Sem conexão com a internet. Verifique sua rede.'
    : 'Não foi possível conectar ao servidor. Esta rede pode estar bloqueando o acesso.';

  const tip = !isOnline
    ? 'Conecte-se a uma rede Wi-Fi ou ative os dados móveis.'
    : 'Tente usar dados móveis (4G/5G) ou outra rede Wi-Fi.';

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
      <div className="flex items-center gap-3 max-w-screen-lg mx-auto">
        <WifiOff className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{message}</p>
          <p className="text-xs text-destructive/70 mt-0.5">{tip}</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Tentando...' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
};
