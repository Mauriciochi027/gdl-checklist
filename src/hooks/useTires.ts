import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useSupabaseAuth';

export interface Tire {
  id: string;
  code: string;
  model: string | null;
  status: 'estoque' | 'em_uso' | 'em_reforma';
  equipment_id: string | null;
  position: string | null;
  initial_depth: number | null;
  initial_hour_meter: number | null;
  mounted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  latest_depth: number | null;
  equipment?: { id: string; code: string; model: string } | null;
}

export interface TireMeasurement {
  id: string;
  tire_id: string;
  depth: number;
  measured_at: string;
  notes: string | null;
  measured_by: string | null;
  created_at: string | null;
}

export interface TireFormData {
  code: string;
  model?: string;
  status: 'estoque' | 'em_uso' | 'em_reforma';
  equipment_id?: string;
  position?: string;
  initial_depth?: number;
  initial_hour_meter?: number;
}

export interface MeasurementFormData {
  tire_id: string;
  depth: number;
  measured_at: string;
  notes?: string;
  measured_by?: string;
}

const TIRES_KEY = ['tires'] as const;
const TIRE_MEASUREMENTS_KEY = (tireId: string) => ['tire-measurements', tireId] as const;

const fetchTires = async (): Promise<Tire[]> => {
  const { data, error } = await supabase
    .from('tires')
    .select(`*, equipment:equipment_id (id, code, model)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const tireIds = (data || []).map((t: any) => t.id);
  let latestDepthMap = new Map<string, number>();

  if (tireIds.length > 0) {
    const { data: allMeasurements } = await supabase
      .from('tire_measurements')
      .select('tire_id, depth, measured_at')
      .in('tire_id', tireIds)
      .order('measured_at', { ascending: false });

    if (allMeasurements) {
      for (const m of allMeasurements) {
        if (!latestDepthMap.has(m.tire_id)) {
          latestDepthMap.set(m.tire_id, m.depth);
        }
      }
    }
  }

  return (data || []).map((tire: any) => ({
    ...tire,
    latest_depth: latestDepthMap.get(tire.id) ?? null,
  } as Tire));
};

export const useTires = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tires = [], isLoading } = useQuery({
    queryKey: TIRES_KEY,
    queryFn: fetchTires,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const createTire = useCallback(async (formData: TireFormData) => {
    try {
      const { error } = await supabase.from('tires').insert({
        code: formData.code,
        model: formData.model || null,
        status: formData.status,
        equipment_id: formData.equipment_id || null,
        position: formData.position || null,
        initial_depth: formData.initial_depth || null,
        initial_hour_meter: formData.initial_hour_meter || null,
        mounted_at: formData.status === 'em_uso' ? new Date().toISOString() : null,
      });
      if (error) throw error;
      toast({ title: 'Pneu cadastrado', description: `Pneu ${formData.code} cadastrado com sucesso.` });
      queryClient.invalidateQueries({ queryKey: TIRES_KEY });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao cadastrar pneu', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [toast, queryClient]);

  const updateTire = useCallback(async (id: string, formData: Partial<TireFormData>) => {
    try {
      const updateData: any = { ...formData };
      if (formData.status === 'em_uso' && formData.equipment_id) {
        updateData.mounted_at = new Date().toISOString();
      }
      const { error } = await supabase.from('tires').update(updateData).eq('id', id);
      if (error) throw error;
      toast({ title: 'Pneu atualizado', description: 'Informações atualizadas com sucesso.' });
      queryClient.invalidateQueries({ queryKey: TIRES_KEY });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar pneu', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [toast, queryClient]);

  const deleteTire = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('tires').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Pneu excluído', description: 'Pneu removido com sucesso.' });
      queryClient.invalidateQueries({ queryKey: TIRES_KEY });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao excluir pneu', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [toast, queryClient]);

  const stats = useMemo(() => ({
    total: tires.length,
    estoque: tires.filter(t => t.status === 'estoque').length,
    emUso: tires.filter(t => t.status === 'em_uso').length,
    emReforma: tires.filter(t => t.status === 'em_reforma').length,
  }), [tires]);

  return {
    tires,
    isLoading,
    stats,
    fetchTires: () => queryClient.invalidateQueries({ queryKey: TIRES_KEY }),
    createTire,
    updateTire,
    deleteTire,
  };
};

export const useTireMeasurements = (tireId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: TIRE_MEASUREMENTS_KEY(tireId),
    queryFn: async () => {
      if (!tireId) return [];
      const { data, error } = await supabase
        .from('tire_measurements')
        .select('*')
        .eq('tire_id', tireId)
        .order('measured_at', { ascending: false });
      if (error) throw error;
      return (data as TireMeasurement[]) || [];
    },
    enabled: !!tireId,
    staleTime: 2 * 60 * 1000,
  });

  const addMeasurement = useCallback(async (formData: MeasurementFormData) => {
    try {
      const { error } = await supabase.from('tire_measurements').insert({
        tire_id: formData.tire_id,
        depth: formData.depth,
        measured_at: formData.measured_at,
        notes: formData.notes || null,
        measured_by: formData.measured_by || null,
      });
      if (error) throw error;
      toast({ title: 'Medição registrada', description: 'Medição registrada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: TIRE_MEASUREMENTS_KEY(tireId) });
      queryClient.invalidateQueries({ queryKey: TIRES_KEY }); // refresh latest_depth
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao registrar medição', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [tireId, toast, queryClient]);

  const deleteMeasurement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('tire_measurements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Medição excluída', description: 'Medição removida com sucesso.' });
      queryClient.invalidateQueries({ queryKey: TIRE_MEASUREMENTS_KEY(tireId) });
      queryClient.invalidateQueries({ queryKey: TIRES_KEY });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao excluir medição', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [tireId, toast, queryClient]);

  return {
    measurements,
    isLoading,
    fetchMeasurements: () => queryClient.invalidateQueries({ queryKey: TIRE_MEASUREMENTS_KEY(tireId) }),
    addMeasurement,
    deleteMeasurement,
  };
};
