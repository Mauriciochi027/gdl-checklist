import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useChecklists = () => {
  const [checklistRecords, setChecklistRecords] = useState<ChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all checklist records with related data - memoizado para evitar loops
  const fetchChecklists = useCallback(async () => {
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

      if (error) {
        console.error('[useChecklists] Erro na query:', error);
        throw error;
      }

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

      console.log('[useChecklists] Checklists carregados:', transformedRecords.length);
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
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    let authSubscription: any = null;
    let realtimeChannel: any = null;

    const loadData = async () => {
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

        if (error) {
          console.error('[useChecklists] Erro na query:', error);
          throw error;
        }

        if (!isMounted) return;

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

        console.log('[useChecklists] Checklists carregados:', transformedRecords.length);
        setChecklistRecords(transformedRecords);
        setIsLoading(false);
      } catch (error) {
        console.error('[useChecklists] Erro:', error);
        if (isMounted) {
          toast({
            title: "Erro ao carregar checklists",
            description: "Não foi possível carregar os registros de checklist.",
            variant: "destructive"
          });
          setChecklistRecords([]);
          setIsLoading(false);
        }
      }
    };

    const debouncedLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) loadData();
      }, 1000);
    };

    const initializeData = async () => {
      // Verificar se já está autenticado na montagem
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        await loadData();
      } else if (isMounted) {
        setIsLoading(false);
      }

      // Configurar listener de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[useChecklists] Usuário autenticado, carregando dados...');
          loadData();
        } else if (event === 'SIGNED_OUT') {
          console.log('[useChecklists] Usuário deslogado, limpando dados...');
          setChecklistRecords([]);
          setIsLoading(false);
        }
      });
      
      authSubscription = subscription;

      // Realtime subscription otimizada
      const channel = supabase
        .channel('checklists-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_records'
          },
          (payload) => {
            console.log('[useChecklists] Realtime update on checklist_records:', payload);
            debouncedLoad();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_approvals'
          },
          (payload) => {
            console.log('[useChecklists] Realtime update on checklist_approvals:', payload);
            debouncedLoad();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_rejections'
          },
          (payload) => {
            console.log('[useChecklists] Realtime update on checklist_rejections:', payload);
            debouncedLoad();
          }
        )
        .subscribe((status) => {
          console.log('[useChecklists] Subscription status:', status);
        });
      
      realtimeChannel = channel;
    };

    initializeData();

    return () => {
      console.log('[useChecklists] Cleaning up subscriptions');
      isMounted = false;
      clearTimeout(debounceTimer);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
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
    location?: string | null;
    unit?: string | null;
    equipmentSeries?: string | null;
    equipmentNumber?: string | null;
    hourMeter?: number | null;
  }) => {
    try {
      console.log('[useChecklists] Iniciando inserção de checklist...');
      // Calculate stats
      const conformeItems = checklistData.answers.filter(a => a.value === 'sim').length;
      const naoConformeItems = checklistData.answers.filter(a => a.value === 'nao').length;
      const hasCriticalIssues = naoConformeItems > 0;
      
      // Para checklists de içamento com não conformes: status = negado (não passa por aprovação)
      // Para empilhadeiras com não conformes: status = pendente (passa por aprovação)
      const isLiftingAccessory = checklistData.checklistType && checklistData.checklistType !== 'empilhadeira';
      let status: 'conforme' | 'pendente' | 'negado';
      
      if (hasCriticalIssues) {
        status = isLiftingAccessory ? 'negado' : 'pendente';
      } else {
        status = 'conforme';
      }

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
        loadDescription: checklistData.loadDescription,
        location: checklistData.location,
        unit: checklistData.unit,
        equipmentSeries: checklistData.equipmentSeries,
        equipmentNumber: checklistData.equipmentNumber,
        hourMeter: checklistData.hourMeter
      });

      const { data: record, error: recordError } = await supabase
        .from('checklist_records')
        .insert([recordData])
        .select()
        .single();

      if (recordError) {
        console.error('[useChecklists] Erro ao inserir checklist_record:', recordError);
        throw recordError;
      }
      
      console.log('[useChecklists] Checklist record inserido:', record.id);

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

      if (answersError) {
        console.error('[useChecklists] Erro ao inserir respostas:', answersError);
        throw answersError;
      }
      
      console.log('[useChecklists] Respostas inseridas:', answersToInsert.length);

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

          if (photosError) {
            console.error('[useChecklists] Erro ao inserir fotos:', photosError);
            throw photosError;
          }
          
          console.log('[useChecklists] Fotos inseridas:', photosToInsert.length);
        }
      }

      // Auto-approve only for empilhadeira checklists if all items are conforme
      // Checklists de içamento nunca são auto-aprovados
      
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
          console.error('[useChecklists] Erro ao auto-aprovar:', approvalError);
          // Não lançar erro aqui - a inserção principal foi bem-sucedida
        } else {
          console.log('[useChecklists] Checklist auto-aprovado');
        }
      }
      
      // Toast messages based on checklist type and status
      let toastDescription = '';
      
      if (isLiftingAccessory) {
        if (status === 'negado') {
          toastDescription = "Checklist registrado. Equipamento bloqueado devido a itens não conformes.";
        } else {
          toastDescription = "Checklist de acessório de içamento registrado com sucesso!";
        }
      } else {
        if (status === 'conforme') {
          toastDescription = "Checklist aprovado automaticamente!";
        } else {
          toastDescription = "Checklist enviado para aprovação do mecânico.";
        }
      }
      
      toast({
        title: "Checklist registrado",
        description: toastDescription,
        variant: status === 'negado' ? 'destructive' : 'default'
      });

      console.log('[useChecklists] Checklist completo registrado com sucesso');
      // Não precisa refetch - realtime vai atualizar
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
      console.log('[useChecklists] Aprovando checklist:', recordId);
      
      // Update record status
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'conforme' })
        .eq('id', recordId);

      if (updateError) {
        console.error('[useChecklists] Erro ao atualizar status:', updateError);
        throw updateError;
      }

      // Add approval
      const approvalData = keysToSnakeCase({
        checklistRecordId: recordId,
        mechanicName: mechanicName,
        comment
      });

      const { error: approvalError } = await supabase
        .from('checklist_approvals')
        .insert([approvalData]);

      if (approvalError) {
        console.error('[useChecklists] Erro ao inserir aprovação:', approvalError);
        throw approvalError;
      }

      toast({
        title: "Checklist aprovado",
        description: "O checklist foi aprovado com sucesso."
      });

      console.log('[useChecklists] Checklist aprovado com sucesso');
      // Não precisa refetch - realtime vai atualizar
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
      console.log('[useChecklists] Rejeitando checklist:', recordId);
      
      // Update record status
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'negado' })
        .eq('id', recordId);

      if (updateError) {
        console.error('[useChecklists] Erro ao atualizar status:', updateError);
        throw updateError;
      }

      // Add rejection
      const rejectionData = keysToSnakeCase({
        checklistRecordId: recordId,
        mechanicName: mechanicName,
        reason
      });

      const { error: rejectionError } = await supabase
        .from('checklist_rejections')
        .insert([rejectionData]);

      if (rejectionError) {
        console.error('[useChecklists] Erro ao inserir rejeição:', rejectionError);
        throw rejectionError;
      }

      toast({
        title: "Checklist negado",
        description: "O checklist foi negado e o operador será notificado."
      });

      console.log('[useChecklists] Checklist rejeitado com sucesso');
      // Não precisa refetch - realtime vai atualizar
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
