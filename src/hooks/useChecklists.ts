import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';

export const useChecklists = () => {
  const [checklistRecords, setChecklistRecords] = useState<ChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all checklist records with related data
  const fetchChecklists = async () => {
    try {
      const { data: records, error } = await supabase
        .from('checklist_records')
        .select(`
          *,
          checklist_answers (*),
          checklist_photos (*),
          checklist_approvals (*),
          checklist_rejections (*)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const transformedRecords = records?.map(record => ({
        id: record.id,
        equipmentId: record.equipment_id,
        equipmentCode: record.equipment_code,
        equipmentModel: record.equipment_model,
        operatorName: record.operator_name,
        operatorId: record.operator_id,
        timestamp: record.timestamp,
        status: record.status as 'conforme' | 'pendente' | 'negado',
        totalItems: record.total_items,
        conformeItems: record.conforme_items,
        naoConformeItems: record.nao_conforme_items,
        answers: record.checklist_answers?.map((a: any) => ({
          itemId: a.item_id,
          value: a.value,
          observation: a.observation
        })) || [],
        signature: record.signature,
        photos: record.checklist_photos?.reduce((acc: any, photo: any) => {
          if (!acc[photo.item_id]) acc[photo.item_id] = [];
          acc[photo.item_id].push(photo.photo_url);
          return acc;
        }, {}) || {},
        hasCriticalIssues: record.has_critical_issues,
        approvals: record.checklist_approvals?.map((a: any) => ({
          mechanicName: a.mechanic_name,
          timestamp: a.timestamp,
          comment: a.comment
        })) || [],
        rejections: record.checklist_rejections?.map((r: any) => ({
          mechanicName: r.mechanic_name,
          timestamp: r.timestamp,
          reason: r.reason
        })) || []
      })) || [];

      setChecklistRecords(transformedRecords);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast({
        title: "Erro ao carregar checklists",
        description: "Não foi possível carregar os registros de checklist.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const addChecklist = async (checklistData: {
    equipmentId: string;
    equipmentCode: string;
    equipmentModel: string;
    operatorName: string;
    operatorId: string;
    answers: ChecklistAnswer[];
    signature: string;
    photos?: Record<string, string[]>;
  }) => {
    try {
      // Calculate stats
      const conformeItems = checklistData.answers.filter(a => a.value === 'sim').length;
      const naoConformeItems = checklistData.answers.filter(a => a.value === 'nao').length;
      const hasCriticalIssues = naoConformeItems > 0;
      const status: 'conforme' | 'pendente' = hasCriticalIssues ? 'pendente' : 'conforme';

      // Insert checklist record
      const { data: record, error: recordError } = await supabase
        .from('checklist_records')
        .insert([{
          equipment_id: checklistData.equipmentId,
          equipment_code: checklistData.equipmentCode,
          equipment_model: checklistData.equipmentModel,
          operator_name: checklistData.operatorName,
          operator_id: checklistData.operatorId,
          status,
          total_items: checklistData.answers.length,
          conforme_items: conformeItems,
          nao_conforme_items: naoConformeItems,
          signature: checklistData.signature,
          has_critical_issues: hasCriticalIssues
        }])
        .select()
        .single();

      if (recordError) throw recordError;

      // Insert answers
      const answersToInsert = checklistData.answers.map(answer => ({
        checklist_record_id: record.id,
        item_id: answer.itemId,
        value: answer.value,
        observation: answer.observation
      }));

      const { error: answersError } = await supabase
        .from('checklist_answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      // Insert photos if any
      if (checklistData.photos) {
        const photosToInsert = Object.entries(checklistData.photos).flatMap(([itemId, urls]) =>
          urls.map(url => ({
            checklist_record_id: record.id,
            item_id: itemId,
            photo_url: url
          }))
        );

        if (photosToInsert.length > 0) {
          const { error: photosError } = await supabase
            .from('checklist_photos')
            .insert(photosToInsert);

          if (photosError) throw photosError;
        }
      }

      // Auto-approve if all items are conforme
      if (status === 'conforme') {
        const { error: approvalError } = await supabase
          .from('checklist_approvals')
          .insert([{
            checklist_record_id: record.id,
            mechanic_name: 'Sistema',
            comment: 'Checklist aprovado automaticamente - todos os itens conformes'
          }]);

        if (approvalError) throw approvalError;
      }

      toast({
        title: "Checklist registrado",
        description: status === 'conforme' 
          ? "Checklist aprovado automaticamente!" 
          : "Checklist enviado para aprovação do mecânico."
      });

      await fetchChecklists();
      return record;
    } catch (error: any) {
      console.error('Error adding checklist:', error);
      toast({
        title: "Erro ao registrar checklist",
        description: error.message || "Não foi possível registrar o checklist.",
        variant: "destructive"
      });
      return null;
    }
  };

  const approveChecklist = async (recordId: string, mechanicName: string, comment: string) => {
    try {
      // Update record status
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'conforme' })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // Add approval
      const { error: approvalError } = await supabase
        .from('checklist_approvals')
        .insert([{
          checklist_record_id: recordId,
          mechanic_name: mechanicName,
          comment
        }]);

      if (approvalError) throw approvalError;

      toast({
        title: "Checklist aprovado",
        description: "O checklist foi aprovado com sucesso."
      });

      await fetchChecklists();
      return true;
    } catch (error: any) {
      console.error('Error approving checklist:', error);
      toast({
        title: "Erro ao aprovar checklist",
        description: error.message || "Não foi possível aprovar o checklist.",
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectChecklist = async (recordId: string, mechanicName: string, reason: string) => {
    try {
      // Update record status
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'negado' })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // Add rejection
      const { error: rejectionError } = await supabase
        .from('checklist_rejections')
        .insert([{
          checklist_record_id: recordId,
          mechanic_name: mechanicName,
          reason
        }]);

      if (rejectionError) throw rejectionError;

      toast({
        title: "Checklist negado",
        description: "O checklist foi negado e o operador será notificado."
      });

      await fetchChecklists();
      return true;
    } catch (error: any) {
      console.error('Error rejecting checklist:', error);
      toast({
        title: "Erro ao negar checklist",
        description: error.message || "Não foi possível negar o checklist.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    checklistRecords,
    isLoading,
    addChecklist,
    approveChecklist,
    rejectChecklist,
    refreshChecklists: fetchChecklists
  };
};
