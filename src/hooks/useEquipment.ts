import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useEquipment = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Fetch all equipment
  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      console.log('[useEquipment] Iniciando carregamento de equipamentos...');
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      // Transform database format to Equipment interface format
      const transformedData = keysToCamelCase<Equipment[]>(data || []);
      
      console.log('[useEquipment] Equipamentos carregados:', transformedData.length);
      setEquipments(transformedData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Erro ao carregar equipamentos",
        description: "Não foi possível carregar a lista de equipamentos.",
        variant: "destructive"
      });
    } finally {
      console.log('[useEquipment] Finalizando carregamento');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      // Wait for auth session to be ready
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[useEquipment] Sessão autenticada, iniciando fetch...');
        await fetchEquipments();
      } else {
        console.log('[useEquipment] Sem sessão, aguardando autenticação...');
        setIsLoading(false);
      }
      
      setIsInitialized(true);
    };

    initFetch();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[useEquipment] Usuário autenticado, buscando dados...');
        await fetchEquipments();
      } else if (event === 'SIGNED_OUT') {
        console.log('[useEquipment] Usuário deslogado, limpando dados...');
        setEquipments([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      // Transform camelCase to snake_case for database
      const dbEquipment = keysToSnakeCase(equipment);

      const { data, error } = await supabase
        .from('equipment')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) throw error;

      const transformed = keysToCamelCase<Equipment>(data);

      setEquipments(prev => [...prev, transformed]);
      
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
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      // Transform camelCase to snake_case for database
      const dbUpdates = keysToSnakeCase(updates);

      const { data, error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformed = keysToCamelCase<Equipment>(data);

      setEquipments(prev => prev.map(eq => eq.id === id ? transformed : eq));
      
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
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEquipments(prev => prev.filter(eq => eq.id !== id));
      
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
