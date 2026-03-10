import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';
import { useAuth } from '@/hooks/useSupabaseAuth';

const CHECKLISTS_KEY = ['checklists'] as const;

/**
 * Fetch checklists with approvals/rejections in parallel
 */
const fetchChecklists = async (): Promise<any[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data: records, error } = await supabase
    .from('checklist_records')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(200);

  if (error) throw error;
  if (!records || records.length === 0) return [];

  const recordIds = records.map(r => r.id);

  // Fetch approvals and rejections in parallel
  const [approvalsResult, rejectionsResult] = await Promise.all([
    supabase.from('checklist_approvals').select('*').in('checklist_record_id', recordIds),
    supabase.from('checklist_rejections').select('*').in('checklist_record_id', recordIds),
  ]);

  const approvalsByRecord = new Map<string, any[]>();
  (approvalsResult.data || []).forEach(a => {
    const list = approvalsByRecord.get(a.checklist_record_id) || [];
    list.push({ mechanicName: a.mechanic_name, timestamp: a.timestamp, comment: a.comment });
    approvalsByRecord.set(a.checklist_record_id, list);
  });

  const rejectionsByRecord = new Map<string, any[]>();
  (rejectionsResult.data || []).forEach(r => {
    const list = rejectionsByRecord.get(r.checklist_record_id) || [];
    list.push({ mechanicName: r.mechanic_name, timestamp: r.timestamp, reason: r.reason });
    rejectionsByRecord.set(r.checklist_record_id, list);
  });

  return records.map(record => {
    const camelRecord = keysToCamelCase(record);
    return {
      ...camelRecord,
      photos: {},
      checklistAnswers: [],
      approvals: approvalsByRecord.get(record.id) || [],
      rejections: rejectionsByRecord.get(record.id) || [],
    };
  });
};

export const useChecklists = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: checklistRecords = [], isLoading } = useQuery({
    queryKey: CHECKLISTS_KEY,
    queryFn: fetchChecklists,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,  // 2 min fresh
    gcTime: 10 * 60 * 1000,    // 10 min cache
    refetchOnMount: false,      // Usa cache do prefetch
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Realtime: invalidar cache quando há mudanças
  useEffect(() => {
    if (!user) return;
    let debounceTimer: NodeJS.Timeout;

    const debouncedInvalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY });
      }, 1500);
    };

    const channel = supabase
      .channel('checklists-changes-rq')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_records' }, debouncedInvalidate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checklist_approvals' }, debouncedInvalidate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checklist_rejections' }, debouncedInvalidate)
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const addChecklist = async (checklistData: {
    equipmentId: string | null;
    equipmentCode: string;
    equipmentModel: string;
    operatorName: string;
    operatorId: string;
    answers: ChecklistAnswer[];
    signature: string;
    photos?: Record<string, string[]>;
    checklistType?: string;
    operationDescription?: string;
    loadDescription?: string;
    location?: string | null;
    unit?: string | null;
    equipmentSeries?: string | null;
    equipmentNumber?: string | null;
    hourMeter?: number | null;
  }) => {
    try {
      const conformeItems = checklistData.answers.filter(a => a.value === 'sim').length;
      const naoConformeItems = checklistData.answers.filter(a => a.value === 'nao').length;
      const hasCriticalIssues = naoConformeItems > 0;
      const isLiftingAccessory = checklistData.checklistType && checklistData.checklistType !== 'empilhadeira';
      
      let status: 'conforme' | 'pendente' | 'negado';
      if (hasCriticalIssues) {
        status = isLiftingAccessory ? 'negado' : 'pendente';
      } else {
        status = 'conforme';
      }

      const recordData = keysToSnakeCase({
        equipmentId: checklistData.equipmentId,
        equipmentCode: checklistData.equipmentCode,
        equipmentModel: checklistData.equipmentModel,
        operatorName: checklistData.operatorName,
        operatorId: checklistData.operatorId,
        status,
        totalItems: checklistData.answers.length,
        conformeItems,
        naoConformeItems,
        signature: checklistData.signature,
        hasCriticalIssues,
        checklistType: checklistData.checklistType || 'empilhadeira',
        operationDescription: checklistData.operationDescription,
        loadDescription: checklistData.loadDescription,
        location: checklistData.location,
        unit: checklistData.unit,
        equipmentSeries: checklistData.equipmentSeries,
        equipmentNumber: checklistData.equipmentNumber,
        hourMeter: checklistData.hourMeter,
      });

      const { data: record, error: recordError } = await supabase
        .from('checklist_records')
        .insert([recordData])
        .select()
        .single();

      if (recordError) throw recordError;

      // Insert answers
      const answersToInsert = checklistData.answers.map(answer =>
        keysToSnakeCase({
          checklistRecordId: record.id,
          itemId: answer.itemId,
          value: answer.value,
          observation: answer.observation,
        })
      );
      const { error: answersError } = await supabase.from('checklist_answers').insert(answersToInsert);
      if (answersError) throw answersError;

      // Insert photos
      if (checklistData.photos) {
        const photosToInsert = Object.entries(checklistData.photos).flatMap(([itemId, urls]) =>
          urls.map(url => keysToSnakeCase({ checklistRecordId: record.id, itemId, photoUrl: url }))
        );
        if (photosToInsert.length > 0) {
          const { error: photosError } = await supabase.from('checklist_photos').insert(photosToInsert);
          if (photosError) throw photosError;
        }
      }

      // Auto-approve empilhadeira conformes
      if (status === 'conforme' && !isLiftingAccessory) {
        await supabase.from('checklist_approvals').insert([keysToSnakeCase({
          checklistRecordId: record.id,
          mechanicName: 'Sistema',
          comment: 'Checklist aprovado automaticamente - todos os itens conformes',
        })]);
      }

      let toastDescription = '';
      if (isLiftingAccessory) {
        toastDescription = status === 'negado'
          ? "Checklist registrado. Equipamento bloqueado devido a itens não conformes."
          : "Checklist de acessório de içamento registrado com sucesso!";
      } else {
        toastDescription = status === 'conforme'
          ? "Checklist aprovado automaticamente!"
          : "Checklist enviado para aprovação do mecânico.";
      }

      toast({ title: "Checklist registrado", description: toastDescription, variant: status === 'negado' ? 'destructive' : 'default' });

      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY });
      return record;
    } catch (error: any) {
      console.error('[useChecklists] Erro:', error);
      toast({ title: "Erro ao registrar checklist", description: error.message || "Erro desconhecido.", variant: "destructive" });
      return null;
    }
  };

  const approveChecklist = async (recordId: string, mechanicName: string, comment: string) => {
    try {
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'conforme' })
        .eq('id', recordId);
      if (updateError) throw updateError;

      const { error: approvalError } = await supabase
        .from('checklist_approvals')
        .insert([keysToSnakeCase({ checklistRecordId: recordId, mechanicName, comment })]);
      if (approvalError) throw approvalError;

      toast({ title: "Checklist aprovado", description: "O checklist foi aprovado com sucesso." });
      queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao aprovar checklist", description: error.message || "Erro desconhecido.", variant: "destructive" });
      return false;
    }
  };

  const rejectChecklist = async (recordId: string, mechanicName: string, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'negado' })
        .eq('id', recordId);
      if (updateError) throw updateError;

      const { error: rejectionError } = await supabase
        .from('checklist_rejections')
        .insert([keysToSnakeCase({ checklistRecordId: recordId, mechanicName, reason })]);
      if (rejectionError) throw rejectionError;

      toast({ title: "Checklist negado", description: "O checklist foi negado e o operador será notificado." });
      queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao negar checklist", description: error.message || "Erro desconhecido.", variant: "destructive" });
      return false;
    }
  };

  const deleteChecklist = async (recordId: string) => {
    try {
      const { error } = await supabase.from('checklist_records').delete().eq('id', recordId);
      if (error) throw error;

      toast({ title: "Checklist excluído", description: "Registro removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao excluir checklist", description: error.message || "Erro desconhecido.", variant: "destructive" });
      return false;
    }
  };

  return {
    checklistRecords,
    isLoading,
    addChecklist,
    approveChecklist,
    rejectChecklist,
    deleteChecklist,
    refreshChecklists: () => queryClient.invalidateQueries({ queryKey: CHECKLISTS_KEY }),
  };
};
