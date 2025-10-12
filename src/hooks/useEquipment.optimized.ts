import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';
import { useOptimizedQuery } from './useOptimizedQuery';

/**
 * Hook otimizado para gerenciamento de equipamentos
 * - Cache automático
 * - Queries otimizadas
 * - Memoização de operações
 */
export const useEquipmentOptimized = () => {
  const { toast } = useToast();

  // Query otimizada com cache
  const {
    data: equipments,
    isLoading,
    refetch,
    invalidateCache,
  } = useOptimizedQuery<Equipment[]>({
    queryFn: async () => {
      console.log('[useEquipment] Fetching equipments...');
      
      const { data, error } = await supabase
        .from('equipment')
        .select('id, code, brand, model, sector, status, year, unit, updated_at')
        .order('code', { ascending: true });

      if (error) throw error;

      return keysToCamelCase<Equipment[]>(data || []);
    },
    cacheKey: 'equipments',
    cacheTime: 3 * 60 * 1000, // 3 minutos
    onError: (error) => {
      console.error('[useEquipment] Error:', error);
      toast({
        title: "Erro ao carregar equipamentos",
        description: "Não foi possível carregar a lista de equipamentos.",
        variant: "destructive"
      });
    },
  });

  // Adicionar equipamento
  const addEquipment = useCallback(async (equipment: Omit<Equipment, 'id'>) => {
    try {
      const dbEquipment = keysToSnakeCase(equipment);

      const { data, error } = await supabase
        .from('equipment')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) throw error;

      const transformed = keysToCamelCase<Equipment>(data);
      
      // Invalidar cache para forçar refresh
      invalidateCache();
      refetch(true);
      
      toast({
        title: "Equipamento cadastrado",
        description: `${equipment.code} foi adicionado com sucesso.`
      });

      return transformed;
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Erro ao cadastrar equipamento",
        description: error.message || "Não foi possível cadastrar o equipamento.",
        variant: "destructive"
      });
      return null;
    }
  }, [invalidateCache, refetch, toast]);

  // Atualizar equipamento
  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
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
      
      // Invalidar cache
      invalidateCache();
      refetch(true);
      
      toast({
        title: "Equipamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });

      return transformed;
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Erro ao atualizar equipamento",
        description: error.message || "Não foi possível atualizar o equipamento.",
        variant: "destructive"
      });
      return null;
    }
  }, [invalidateCache, refetch, toast]);

  // Deletar equipamento
  const deleteEquipment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidar cache
      invalidateCache();
      refetch(true);
      
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Erro ao remover equipamento",
        description: error.message || "Não foi possível remover o equipamento.",
        variant: "destructive"
      });
      return false;
    }
  }, [invalidateCache, refetch, toast]);

  // Equipamentos filtrados por status (memoizado)
  const equipmentsByStatus = useMemo(() => {
    if (!equipments) return { disponivel: [], operando: [], maintenance: [] };
    
    return {
      disponivel: equipments.filter(eq => eq.status === 'disponivel'),
      operando: equipments.filter(eq => eq.status === 'operando'),
      maintenance: equipments.filter(eq => eq.status === 'maintenance'),
    };
  }, [equipments]);

  return {
    equipments: equipments || [],
    isLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipments: () => refetch(true),
    equipmentsByStatus,
  };
};
