import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { 
  QUERY_KEYS, CACHE_TIMES, EQUIPMENT_LIGHT_COLUMNS, 
  withTiming, getAbortSignal, RETRY_CONFIG 
} from '@/lib/queryConfig';

/**
 * Fetch equipment WITHOUT photo field to reduce payload dramatically.
 * Uses abort signal for timeout protection.
 */
const fetchAllEquipment = async (): Promise<Equipment[]> => {
  return withTiming('fetchAllEquipment', async () => {
    const signal = getAbortSignal('equipment', 20000);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      if (!refreshed) return [];
    }

    const allData: any[] = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      if (signal.aborted) throw new Error('Query aborted - timeout');
      
      const { data, error } = await supabase
        .from('equipment')
        .select(EQUIPMENT_LIGHT_COLUMNS)
        .order('code', { ascending: true })
        .range(offset, offset + batchSize - 1)
        .abortSignal(signal);

      if (error) throw error;
      if (data && data.length > 0) {
        allData.push(...data);
        offset += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return keysToCamelCase<Equipment[]>(allData);
  });
};

export const useEquipment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.equipment,
    queryFn: fetchAllEquipment,
    enabled: !!user,
    ...CACHE_TIMES.equipment,
    ...RETRY_CONFIG,
    refetchOnMount: false, // Use prefetch cache - don't refetch every mount
  });

  // Single realtime subscription - optimistic cache updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('equipment-changes-rq')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEq = keysToCamelCase<Equipment>(payload.new);
          queryClient.setQueryData<Equipment[]>(QUERY_KEYS.equipment, (old = []) => [...old, newEq]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = keysToCamelCase<Equipment>(payload.new);
          queryClient.setQueryData<Equipment[]>(QUERY_KEYS.equipment, (old = []) =>
            old.map(eq => eq.id === updated.id ? updated : eq)
          );
        } else if (payload.eventType === 'DELETE') {
          queryClient.setQueryData<Equipment[]>(QUERY_KEYS.equipment, (old = []) =>
            old.filter(eq => eq.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const addEquipment = useCallback(async (equipment: Omit<Equipment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([keysToSnakeCase(equipment)])
        .select()
        .single();
      if (error) throw error;
      const result = keysToCamelCase<Equipment>(data);
      toast({ title: "Equipamento cadastrado", description: `${result.code} foi adicionado com sucesso.` });
      return result;
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar equipamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(keysToSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Equipamento atualizado", description: "Informações atualizadas com sucesso." });
      return keysToCamelCase<Equipment>(data);
    } catch (error: any) {
      toast({ title: "Erro ao atualizar equipamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Equipamento removido", description: "Removido com sucesso." });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao remover equipamento", description: error.message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const refreshEquipments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.equipment });
  }, [queryClient]);

  return { equipments, isLoading, addEquipment, updateEquipment, deleteEquipment, refreshEquipments };
};
