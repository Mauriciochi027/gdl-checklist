import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';
import { useAuth } from '@/hooks/useSupabaseAuth';

const EQUIPMENT_KEY = ['equipment'] as const;

/**
 * Fetch all equipment with batch pagination to avoid 1000-row limit
 */
const fetchAllEquipment = async (): Promise<Equipment[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const allData: any[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('code', { ascending: true })
      .range(offset, offset + batchSize - 1);

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
};

export const useEquipment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: EQUIPMENT_KEY,
    queryFn: fetchAllEquipment,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min - dados de equipamento mudam pouco
    gcTime: 10 * 60 * 1000,   // 10 min no cache
    refetchOnMount: false,     // Usa cache do prefetch
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Realtime subscription para atualizações automáticas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('equipment-changes-rq')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, (payload) => {
        console.log('[useEquipment] Realtime:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          const newEq = keysToCamelCase<Equipment>(payload.new);
          queryClient.setQueryData<Equipment[]>(EQUIPMENT_KEY, (old = []) => [...old, newEq]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = keysToCamelCase<Equipment>(payload.new);
          queryClient.setQueryData<Equipment[]>(EQUIPMENT_KEY, (old = []) =>
            old.map(eq => eq.id === updated.id ? updated : eq)
          );
        } else if (payload.eventType === 'DELETE') {
          queryClient.setQueryData<Equipment[]>(EQUIPMENT_KEY, (old = []) =>
            old.filter(eq => eq.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const addMutation = useMutation({
    mutationFn: async (equipment: Omit<Equipment, 'id'>) => {
      const { data, error } = await supabase
        .from('equipment')
        .insert([keysToSnakeCase(equipment)])
        .select()
        .single();
      if (error) throw error;
      return keysToCamelCase<Equipment>(data);
    },
    onSuccess: (data) => {
      toast({ title: "Equipamento cadastrado", description: `${data.code} foi adicionado com sucesso.` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar equipamento", description: error.message || "Erro desconhecido.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Equipment> }) => {
      const { data, error } = await supabase
        .from('equipment')
        .update(keysToSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return keysToCamelCase<Equipment>(data);
    },
    onSuccess: () => {
      toast({ title: "Equipamento atualizado", description: "Informações atualizadas com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar equipamento", description: error.message || "Erro desconhecido.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({ title: "Equipamento removido", description: "Removido com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover equipamento", description: error.message || "Erro desconhecido.", variant: "destructive" });
    },
  });

  const addEquipment = useCallback(async (equipment: Omit<Equipment, 'id'>) => {
    try {
      return await addMutation.mutateAsync(equipment);
    } catch { return null; }
  }, [addMutation]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    try {
      return await updateMutation.mutateAsync({ id, updates });
    } catch { return null; }
  }, [updateMutation]);

  const deleteEquipment = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch { return false; }
  }, [deleteMutation]);

  const refreshEquipments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEY });
  }, [queryClient]);

  return {
    equipments,
    isLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipments,
  };
};
