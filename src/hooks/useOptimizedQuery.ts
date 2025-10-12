import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook otimizado para queries com cache e debounce
 */

interface QueryOptions<T> {
  queryFn: () => Promise<T>;
  cacheKey: string;
  cacheTime?: number; // tempo em ms (padrão: 5 minutos)
  enableCache?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// Cache global compartilhado entre instâncias do hook
const queryCache = new Map<string, { data: any; timestamp: number }>();

export const useOptimizedQuery = <T>({
  queryFn,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutos padrão
  enableCache = true,
  onSuccess,
  onError,
}: QueryOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Verificar cache
      if (enableCache && !skipCache) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          console.log(`[useOptimizedQuery] Cache hit: ${cacheKey}`);
          setData(cached.data);
          setIsLoading(false);
          onSuccess?.(cached.data);
          return cached.data;
        }
      }

      console.log(`[useOptimizedQuery] Fetching: ${cacheKey}`);
      setIsLoading(true);
      setError(null);

      const result = await queryFn();

      // Armazenar no cache
      if (enableCache) {
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      // Ignorar erros de cancelamento
      if (err.name === 'AbortError') return;

      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error(`[useOptimizedQuery] Error: ${cacheKey}`, error);
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [queryFn, cacheKey, cacheTime, enableCache, onSuccess, onError]);

  // Fetch inicial
  useEffect(() => {
    fetchData();

    // Cleanup: cancelar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Função para refetch com opção de skip cache
  const refetch = useCallback((skipCache = false) => {
    return fetchData(skipCache);
  }, [fetchData]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    queryCache.delete(cacheKey);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateCache,
  };
};

/**
 * Limpa todo o cache de queries
 */
export const clearAllQueryCache = () => {
  queryCache.clear();
  console.log('[useOptimizedQuery] Cache cleared');
};

/**
 * Limpa cache por padrão de chave
 */
export const clearCacheByPattern = (pattern: RegExp) => {
  const keys = Array.from(queryCache.keys());
  keys.forEach(key => {
    if (pattern.test(key)) {
      queryCache.delete(key);
    }
  });
  console.log(`[useOptimizedQuery] Cache cleared for pattern: ${pattern}`);
};
