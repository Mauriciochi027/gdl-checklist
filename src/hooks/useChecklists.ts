import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistRecord, ChecklistAnswer } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { keysToSnakeCase, keysToCamelCase } from '@/lib/utils';

export const useChecklists = () => {
  const [checklistRecords, setChecklistRecords] = useState<ChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const { toast } = useToast();

  // Optimized fetch with limit
  const fetchChecklists = useCallback(async (limit: number = 100) => {
    try {
      const startTime = Date.now();
      console.log('[useChecklists] Iniciando carregamento com limit:', limit);
      
      setIsLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        console.log('[useChecklists] Sem sessão autenticada');
        setChecklistRecords([]);
        setIsLoading(false);
        return;
      }

      const { data: records, error } = await supabase
        .from('checklist_records')
        .select(`
          *,
          checklist_answers (*),
          checklist_photos (*),
          checklist_approvals (*),
          checklist_rejections (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      console.log('[useChecklists] Query completada em', Date.now() - startTime, 'ms');
      console.log('[useChecklists] Registros retornados:', records?.length || 0);

      if (error) {
        console.error('[useChecklists] Erro na query:', error);
        toast({
          title: "Erro ao carregar checklists",
          description: error.message,
          variant: "destructive"
        });
        return;
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

      console.log('[useChecklists] Transformação completa. Total:', transformedRecords.length);
      setChecklistRecords(transformedRecords);
      setHasInitialLoad(true);
    } catch (error) {
      console.error('[useChecklists] Erro inesperado:', error);
      toast({
        title: "Erro ao carregar checklists",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      console.log('[useChecklists] Finalizando loading state');
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChecklists();

    // Debounced realtime refetch (1000ms)
    let debounceTimer: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('[useChecklists] Realtime: refetch debounced');
        fetchChecklists();
      }, 1000);
    };

    const channel = supabase
      .channel('checklists-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_records' },
        (payload) => {
          console.log('[useChecklists] Realtime: checklist_records changed', payload.eventType);
          debouncedRefetch();
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_approvals' },
        (payload) => {
          console.log('[useChecklists] Realtime: checklist_approvals changed', payload.eventType);
          debouncedRefetch();
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_rejections' },
        (payload) => {
          console.log('[useChecklists] Realtime: checklist_rejections changed', payload.eventType);
          debouncedRefetch();
        })
      .subscribe((status) => {
        console.log('[useChecklists] Subscription status:', status);
      });

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchChecklists]);

  // Upload photo to storage bucket
  const uploadPhotoToStorage = async (photoBase64: string, checklistId: string, itemId: string): Promise<string | null> => {
    try {
      const base64Data = photoBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${checklistId}/${itemId}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('checklist-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('[useChecklists] Erro ao fazer upload:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('checklist-photos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('[useChecklists] Erro ao processar foto:', error);
      return null;
    }
  };

  // Add checklist with retry logic
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
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`[useChecklists] ADD_CHECKLIST tentativa ${attempt}/${maxRetries}`);
        const startTime = Date.now();
        
        toast({
          title: attempt > 1 ? `Tentando novamente (${attempt}/${maxRetries})...` : "Salvando checklist...",
          description: "Por favor aguarde."
        });

        // Upload photos to storage FIRST
        const uploadedPhotos: Record<string, string[]> = {};
        const tempChecklistId = 'temp-' + Date.now();
        
        if (checklistData.photos) {
          for (const [itemId, photoUrls] of Object.entries(checklistData.photos)) {
            uploadedPhotos[itemId] = [];
            for (const photoUrl of photoUrls) {
              if (photoUrl.startsWith('data:')) {
                const storageUrl = await uploadPhotoToStorage(photoUrl, tempChecklistId, itemId);
                if (storageUrl) {
                  uploadedPhotos[itemId].push(storageUrl);
                }
              } else {
                uploadedPhotos[itemId].push(photoUrl);
              }
            }
          }
        }

        // Calculate stats
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

        // Insert record
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
          loadDescription: checklistData.loadDescription
        });

        const { data: record, error: recordError } = await supabase
          .from('checklist_records')
          .insert([recordData])
          .select()
          .single();

        if (recordError) throw recordError;
        console.log('[useChecklists] Checklist record inserido:', record.id);

        // Batch insert answers
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
        console.log('[useChecklists] Respostas inseridas:', answersToInsert.length);

        // Batch insert photos (from storage URLs)
        const photosToInsert = Object.entries(uploadedPhotos).flatMap(([itemId, urls]) =>
          urls.map(url => keysToSnakeCase({
            checklistRecordId: record.id,
            itemId,
            photoUrl: url
          }))
        );

        if (photosToInsert.length > 0) {
          const { error: photosError } = await supabase
            .from('checklist_photos')
            .insert(photosToInsert);

          if (photosError) throw photosError;
          console.log('[useChecklists] Fotos inseridas:', photosToInsert.length);
        }

        // Auto-approve if conforme
        if (status === 'conforme' && !isLiftingAccessory) {
          await supabase.from('checklist_approvals').insert([keysToSnakeCase({
            checklistRecordId: record.id,
            mechanicName: 'Sistema',
            comment: 'Aprovação automática - todos os itens conformes'
          })]);
        }

        console.log('[useChecklists] ADD_CHECKLIST Success em', Date.now() - startTime, 'ms');
        
        let toastDescription = '';
        if (isLiftingAccessory) {
          toastDescription = status === 'negado' 
            ? "Equipamento bloqueado devido a itens não conformes."
            : "Checklist de acessório de içamento registrado!";
        } else {
          toastDescription = status === 'conforme'
            ? "Checklist aprovado automaticamente!"
            : "Checklist enviado para aprovação do mecânico.";
        }
        
        toast({
          title: "Checklist salvo com sucesso!",
          description: toastDescription,
          variant: status === 'negado' ? 'destructive' : 'default'
        });

        return record;

      } catch (error: any) {
        console.error(`[useChecklists] ADD_CHECKLIST Erro (tentativa ${attempt}):`, error);
        
        const isNetworkError = error.message?.includes('fetch') || 
                                error.message?.includes('network') ||
                                error.message?.includes('timeout');
        
        if (!isNetworkError || attempt >= maxRetries) {
          toast({
            title: "Erro ao salvar checklist",
            description: error.message || "Tente novamente mais tarde.",
            variant: "destructive"
          });
          return null;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }

    return null;
  };

  const approveChecklist = async (recordId: string, mechanicName: string, comment: string) => {
    try {
      console.log('[useChecklists] Aprovando checklist:', recordId);
      
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'conforme' })
        .eq('id', recordId);

      if (updateError) throw updateError;

      const { error: approvalError } = await supabase
        .from('checklist_approvals')
        .insert([keysToSnakeCase({
          checklistRecordId: recordId,
          mechanicName,
          comment
        })]);

      if (approvalError) throw approvalError;

      toast({
        title: "Checklist aprovado",
        description: "O checklist foi aprovado com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('[useChecklists] Erro ao aprovar:', error);
      toast({
        title: "Erro ao aprovar checklist",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectChecklist = async (recordId: string, mechanicName: string, reason: string) => {
    try {
      console.log('[useChecklists] Rejeitando checklist:', recordId);
      
      const { error: updateError } = await supabase
        .from('checklist_records')
        .update({ status: 'negado' })
        .eq('id', recordId);

      if (updateError) throw updateError;

      const { error: rejectionError } = await supabase
        .from('checklist_rejections')
        .insert([keysToSnakeCase({
          checklistRecordId: recordId,
          mechanicName,
          reason
        })]);

      if (rejectionError) throw rejectionError;

      toast({
        title: "Checklist negado",
        description: "O checklist foi negado e o operador será notificado."
      });

      return true;
    } catch (error: any) {
      console.error('[useChecklists] Erro ao rejeitar:', error);
      toast({
        title: "Erro ao negar checklist",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    checklistRecords,
    isLoading: isLoading && !hasInitialLoad,
    addChecklist,
    approveChecklist,
    rejectChecklist,
    refreshChecklists: fetchChecklists
  };
};