import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useEquipment = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Fetch all equipment - com proteção contra chamadas múltiplas e retry para 4G
  const fetchEquipments = useCallback(async (showToastOnError = true, retryCount = 0) => {
    const maxRetries = 3;
    
    // Evitar chamadas múltiplas simultâneas
    if (isLoadingRef.current && retryCount === 0) {
      console.log('[useEquipment] Já está carregando, ignorando...');
      return;
    }

    try {
      if (retryCount === 0) {
        isLoadingRef.current = true;
      }
      console.log('[useEquipment] Carregando equipamentos...', retryCount > 0 ? `(tentativa ${retryCount + 1})` : '');
      
      // Verificar sessão antes de fazer query
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[useEquipment] Sem sessão, ignorando fetch');
        setEquipments([]);
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }
      
      // Fetch all equipment with pagination to avoid 1000-row limit
      const allData: any[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error: batchError } = await supabase
          .from('equipment')
          .select('id,code,brand,model,sector,status,year,observations,photo,operator_name,operator_id,location,unit,equipment_series,equipment_number,hour_meter,cost_center,business_unit,last_check,next_maintenance,last_checklist_id,last_operation_start,created_at,updated_at')
          .order('code', { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          throw batchError;
        }

        if (data && data.length > 0) {
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const data = allData;

      const transformedData = keysToCamelCase<Equipment[]>(data || []);
      console.log('[useEquipment] Equipamentos carregados:', transformedData.length);
      setEquipments(transformedData);
      hasLoadedRef.current = true;
    } catch (error: any) {
      console.error('[useEquipment] ERRO:', error);
      
      // Retry em caso de erro genérico de rede
      if (retryCount < maxRetries && (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch') || error.message?.includes('timeout') || error.name === 'TypeError' || error.name === 'AbortError')) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`[useEquipment] Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchEquipments(showToastOnError, retryCount + 1);
      }
      
      if (showToastOnError) {
        toast({
          title: "Erro ao carregar equipamentos",
          description: "Verifique sua conexão e tente novamente.",
          variant: "destructive"
        });
      }
      setEquipments([]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const initializeData = async () => {
      // Verificar se já está autenticado na montagem
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && isMounted && !hasLoadedRef.current) {
        await fetchEquipments(false); // Não mostrar toast no carregamento inicial
      } else if (isMounted && !session) {
        setIsLoading(false);
      }

      // Configurar listener de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[useEquipment] Usuário autenticado, carregando dados...');
          // Delay para garantir que auth está completo
          setTimeout(() => {
            if (isMounted) fetchEquipments(false);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('[useEquipment] Usuário deslogado, limpando dados...');
          setEquipments([]);
          setIsLoading(false);
          hasLoadedRef.current = false;
        }
      });
      
      authSubscription = subscription;

      // Realtime subscription para atualizações automáticas
      realtimeChannel = supabase
        .channel('equipment-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'equipment'
          },
          (payload) => {
            console.log('[useEquipment] Realtime update:', payload.eventType);
            if (!isMounted) return;
            
            if (payload.eventType === 'INSERT') {
              const newEquipment = keysToCamelCase<Equipment>(payload.new);
              setEquipments(prev => [...prev, newEquipment]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedEquipment = keysToCamelCase<Equipment>(payload.new);
              setEquipments(prev => prev.map(eq => eq.id === updatedEquipment.id ? updatedEquipment : eq));
            } else if (payload.eventType === 'DELETE') {
              setEquipments(prev => prev.filter(eq => eq.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    initializeData();

    return () => {
      console.log('[useEquipment] Cleanup');
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchEquipments]);

  const addEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      const dbEquipment = keysToSnakeCase(equipment);

      const { data, error } = await supabase
        .from('equipment')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) throw error;

      const transformed = keysToCamelCase<Equipment>(data);
      
      toast({
        title: "Equipamento cadastrado",
        description: `${equipment.code} foi adicionado com sucesso.`
      });

      return transformed;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao adicionar:', error);
      toast({
        title: "Erro ao cadastrar equipamento",
        description: error.message || "Não foi possível cadastrar o equipamento.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const dbUpdates = keysToSnakeCase(updates);

      const { data, error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformed = keysToCamelCase<Equipment>(data);
      
      toast({
        title: "Equipamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });

      return transformed;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao atualizar:', error);
      toast({
        title: "Erro ao atualizar equipamento",
        description: error.message || "Não foi possível atualizar o equipamento.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao deletar:', error);
      toast({
        title: "Erro ao remover equipamento",
        description: error.message || "Não foi possível remover o equipamento.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    equipments,
    isLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipments: () => fetchEquipments(true)
  };
};
