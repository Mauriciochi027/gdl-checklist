import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  equipment?: {
    id: string;
    code: string;
    model: string;
  } | null;
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

export const useTires = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTires = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tires')
        .select(`
          *,
          equipment:equipment_id (
            id,
            code,
            model
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch latest measurement for each tire
      const tiresWithDepth = await Promise.all(
        (data || []).map(async (tire: any) => {
          const { data: measurements } = await supabase
            .from('tire_measurements')
            .select('depth')
            .eq('tire_id', tire.id)
            .order('measured_at', { ascending: false })
            .limit(1);
          
          return {
            ...tire,
            latest_depth: measurements?.[0]?.depth ?? null,
          } as Tire;
        })
      );

      setTires(tiresWithDepth);
    } catch (error: any) {
      console.error('Erro ao carregar pneus:', error);
      toast({
        title: 'Erro ao carregar pneus',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTire = async (formData: TireFormData) => {
    try {
      const insertData: any = {
        code: formData.code,
        model: formData.model || null,
        status: formData.status,
        equipment_id: formData.equipment_id || null,
        position: formData.position || null,
        initial_depth: formData.initial_depth || null,
        initial_hour_meter: formData.initial_hour_meter || null,
        mounted_at: formData.status === 'em_uso' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('tires')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: 'Pneu cadastrado',
        description: `Pneu ${formData.code} cadastrado com sucesso.`,
      });

      await fetchTires();
      return true;
    } catch (error: any) {
      console.error('Erro ao cadastrar pneu:', error);
      toast({
        title: 'Erro ao cadastrar pneu',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateTire = async (id: string, formData: Partial<TireFormData>) => {
    try {
      const updateData: any = { ...formData };
      
      // Se está sendo montado em equipamento, registrar data
      if (formData.status === 'em_uso' && formData.equipment_id) {
        updateData.mounted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tires')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pneu atualizado',
        description: 'Informações do pneu atualizadas com sucesso.',
      });

      await fetchTires();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar pneu:', error);
      toast({
        title: 'Erro ao atualizar pneu',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTire = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tires')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Pneu excluído',
        description: 'Pneu removido com sucesso.',
      });

      await fetchTires();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir pneu:', error);
      toast({
        title: 'Erro ao excluir pneu',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTires();
  }, []);

  // Estatísticas
  const stats = {
    total: tires.length,
    estoque: tires.filter(t => t.status === 'estoque').length,
    emUso: tires.filter(t => t.status === 'em_uso').length,
    emReforma: tires.filter(t => t.status === 'em_reforma').length,
  };

  return {
    tires,
    isLoading,
    stats,
    fetchTires,
    createTire,
    updateTire,
    deleteTire,
  };
};

export const useTireMeasurements = (tireId: string) => {
  const [measurements, setMeasurements] = useState<TireMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMeasurements = async () => {
    if (!tireId) {
      setMeasurements([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tire_measurements')
        .select('*')
        .eq('tire_id', tireId)
        .order('measured_at', { ascending: false });

      if (error) throw error;
      setMeasurements(data as TireMeasurement[] || []);
    } catch (error: any) {
      console.error('Erro ao carregar medições:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeasurement = async (formData: MeasurementFormData) => {
    try {
      const { error } = await supabase
        .from('tire_measurements')
        .insert({
          tire_id: formData.tire_id,
          depth: formData.depth,
          measured_at: formData.measured_at,
          notes: formData.notes || null,
          measured_by: formData.measured_by || null,
        });

      if (error) throw error;

      toast({
        title: 'Medição registrada',
        description: 'Medição de desgaste registrada com sucesso.',
      });

      await fetchMeasurements();
      return true;
    } catch (error: any) {
      console.error('Erro ao registrar medição:', error);
      toast({
        title: 'Erro ao registrar medição',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMeasurement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tire_measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Medição excluída',
        description: 'Medição removida com sucesso.',
      });

      await fetchMeasurements();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir medição:', error);
      toast({
        title: 'Erro ao excluir medição',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, [tireId]);

  return {
    measurements,
    isLoading,
    fetchMeasurements,
    addMeasurement,
    deleteMeasurement,
  };
};
