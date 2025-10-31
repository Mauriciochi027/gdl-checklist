import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useEquipment = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all equipment - memoizado para evitar loops
  const fetchEquipments = useCallback(async () => {
    try {
      console.log('[useEquipment] ==> Iniciando carregamento de equipamentos...');
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.error('[useEquipment] Erro na query:', error);
        throw error;
      }

      const transformedData = keysToCamelCase<Equipment[]>(data || []);
      console.log('[useEquipment] Equipamentos carregados:', transformedData.length);
      setEquipments(transformedData);
    } catch (error) {
      console.error('[useEquipment] ERRO:', error);
      toast({
        title: "Erro ao carregar equipamentos",
        description: "Não foi possível carregar a lista de equipamentos.",
        variant: "destructive"
      });
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEquipments();

    // Realtime subscription para atualizações automáticas
    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment'
        },
        (payload) => {
          console.log('[useEquipment] Realtime update received:', payload);
          // Atualizar imediatamente sem fazer nova query
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
      .subscribe((status) => {
        console.log('[useEquipment] Subscription status:', status);
      });

    return () => {
      console.log('[useEquipment] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchEquipments]);

  const addEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      console.log('[useEquipment] Inserindo equipamento:', equipment.code);
      
      // Transform camelCase to snake_case for database
      const dbEquipment = keysToSnakeCase(equipment);

      const { data, error } = await supabase
        .from('equipment')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) {
        console.error('[useEquipment] Erro ao inserir:', error);
        throw error;
      }

      const transformed = keysToCamelCase<Equipment>(data);

      // Não precisa atualizar state - realtime vai fazer isso
      
      toast({
        title: "Equipamento cadastrado",
        description: `${equipment.code} foi adicionado com sucesso.`
      });

      console.log('[useEquipment] Equipamento inserido com sucesso:', transformed.id);
      return transformed;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao adicionar equipamento:', error);
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
      console.log('[useEquipment] Atualizando equipamento:', id);
      
      // Transform camelCase to snake_case for database
      const dbUpdates = keysToSnakeCase(updates);

      const { data, error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useEquipment] Erro ao atualizar:', error);
        throw error;
      }

      const transformed = keysToCamelCase<Equipment>(data);

      // Não precisa atualizar state - realtime vai fazer isso
      
      toast({
        title: "Equipamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });

      console.log('[useEquipment] Equipamento atualizado com sucesso');
      return transformed;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao atualizar equipamento:', error);
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
      console.log('[useEquipment] Deletando equipamento:', id);
      
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useEquipment] Erro ao deletar:', error);
        throw error;
      }

      // Não precisa atualizar state - realtime vai fazer isso
      
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido com sucesso."
      });

      console.log('[useEquipment] Equipamento deletado com sucesso');
      return true;
    } catch (error: any) {
      console.error('[useEquipment] Erro ao deletar equipamento:', error);
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
    refreshEquipments: fetchEquipments
  };
};
