import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useChecklists = () => {
  const [checklistRecords, setChecklistRecords] = useState<ChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all checklist records with related data
  const fetchChecklists = async () => {
    try {
      console.log('[useChecklists] Iniciando carregamento...');
      
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

      const transformedRecords = records?.map(record => {
        const camelRecord = keysToCamelCase(record);
        
        const photos: Record<string, string[]> = {};
        if (camelRecord.checklistPhotos) {
          camelRecord.checklistPhotos.forEach((photo: any) => {
            if (!photos[photo.itemId]) photos[photo.itemId] = [];
            photos[photo.itemId].push(photo.photoUrl);
          });
        }
        
        return {
          ...camelRecord,
          photos,
          checklistAnswers: camelRecord.checklistAnswers || [],
          checklistApprovals: camelRecord.checklistApprovals || [],
          checklistRejections: camelRecord.checklistRejections || []
        };
      }) || [];

      console.log('[useChecklists] Carregados:', transformedRecords.length);
      console.log('[useChecklists] Tipos de checklist:', transformedRecords.map(r => r.checklistType).filter((v, i, a) => a.indexOf(v) === i));
      setChecklistRecords(transformedRecords);
    } catch (error) {
      console.error('[useChecklists] Erro:', error);
      toast({
        title: "Erro ao carregar checklists",
        description: "Não foi possível carregar os registros de checklist.",
        variant: "destructive"
      });
      setChecklistRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

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
  }) => {
    try {
      // Calculate stats
      const conformeItems = checklistData.answers.filter(a => a.value === 'sim').length;
      const naoConformeItems = checklistData.answers.filter(a => a.value === 'nao').length;
      const hasCriticalIssues = naoConformeItems > 0;
      const status: 'conforme' | 'pendente' = hasCriticalIssues ? 'pendente' : 'conforme';

      // Insert checklist record
      const recordData = keysToSnakeCase({
        equipmentId: checklistData.equipmentId,
        equipmentCode: checklistData.equipmentCode,
        equipmentModel: checklistData.equipmentModel,
        operatorName: checklistData.operatorName,
        operatorId: checklistData.operatorId,
        status,
        totalItems: checklistData.answers.length,
        conformeItems: conformeItems,
        naoConformeItems: naoConformeItems,
        signature: checklistData.signature,
        hasCriticalIssues: hasCriticalIssues,
        checklistType: checklistData.checklistType || 'empilhadeira',
        operationDescription: checklistData.operationDescription,
        loadDescription: checklistData.loadDescription
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
          observation: answer.observation
        })
      );

      const { error: answersError } = await supabase
        .from('checklist_answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      // Insert photos if any
      if (checklistData.photos) {
        const photosToInsert = Object.entries(checklistData.photos).flatMap(([itemId, urls]) =>
          urls.map(url => keysToSnakeCase({
            checklistRecordId: record.id,
            itemId: itemId,
            photoUrl: url
          }))
        );

        if (photosToInsert.length > 0) {
          const { error: photosError } = await supabase
            .from('checklist_photos')
            .insert(photosToInsert);

          if (photosError) throw photosError;
        }
      }

      // Para checklists de içamento, não fazer auto-aprovação
      // Todos devem passar por aprovação manual do mecânico
      const isLiftingAccessory = checklistData.checklistType !== 'empilhadeira';
      
      // Auto-approve only for empilhadeira checklists if all items are conforme
      if (status === 'conforme' && !isLiftingAccessory) {
        const approvalData = keysToSnakeCase({
          checklistRecordId: record.id,
          mechanicName: 'Sistema',
          comment: 'Checklist aprovado automaticamente - todos os itens conformes'
        });

        const { error: approvalError } = await supabase
          .from('checklist_approvals')
          .insert([approvalData]);

        if (approvalError) {
          console.error('Error auto-approving:', approvalError);
          // Don't throw - checklist was saved successfully, just approval failed
        }
      }

      const isLiftingAccessoryChecklist = checklistData.checklistType !== 'empilhadeira';
      
      toast({
        title: "Checklist registrado",
        description: isLiftingAccessoryChecklist
          ? "Checklist de acessório de içamento registrado com sucesso!"
          : status === 'conforme' 
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
      const approvalData = keysToSnakeCase({
        checklistRecordId: recordId,
        mechanicName: mechanicName,
        comment
      });

      const { error: approvalError } = await supabase
        .from('checklist_approvals')
        .insert([approvalData]);

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
      const rejectionData = keysToSnakeCase({
        checklistRecordId: recordId,
        mechanicName: mechanicName,
        reason
      });

      const { error: rejectionError } = await supabase
        .from('checklist_rejections')
        .insert([rejectionData]);

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
