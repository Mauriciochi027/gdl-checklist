import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keysToCamelCase } from '@/lib/utils';

/**
 * Hook para carregar detalhes de um checklist específico sob demanda
 * Otimizado com queries paralelas para melhor performance
 */
export const useChecklistDetails = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const loadChecklistDetails = useCallback(async (recordId: string) => {
    try {
      setLoading(prev => ({ ...prev, [recordId]: true }));
      
      // Executar todas as queries em paralelo para melhor performance
      const [answersResult, photosResult, approvalsResult, rejectionsResult] = await Promise.all([
        supabase
          .from('checklist_answers')
          .select('*')
          .eq('checklist_record_id', recordId),
        supabase
          .from('checklist_photos')
          .select('*')
          .eq('checklist_record_id', recordId),
        supabase
          .from('checklist_approvals')
          .select('*')
          .eq('checklist_record_id', recordId),
        supabase
          .from('checklist_rejections')
          .select('*')
          .eq('checklist_record_id', recordId)
      ]);

      // Verificar erros
      if (answersResult.error) throw answersResult.error;
      if (photosResult.error) throw photosResult.error;
      if (approvalsResult.error) throw approvalsResult.error;
      if (rejectionsResult.error) throw rejectionsResult.error;

      // Transformar dados de fotos
      const photosByItem: Record<string, string[]> = {};
      photosResult.data?.forEach((photo: any) => {
        const camelPhoto = keysToCamelCase(photo);
        if (!photosByItem[camelPhoto.itemId]) photosByItem[camelPhoto.itemId] = [];
        photosByItem[camelPhoto.itemId].push(camelPhoto.photoUrl);
      });

      return {
        checklistAnswers: answersResult.data?.map(a => keysToCamelCase(a)) || [],
        photos: photosByItem,
        checklistApprovals: approvalsResult.data?.map(a => keysToCamelCase(a)) || [],
        checklistRejections: rejectionsResult.data?.map(r => keysToCamelCase(r)) || []
      };
    } catch (error) {
      console.error('[useChecklistDetails] Erro ao carregar detalhes:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [recordId]: false }));
    }
  }, []);

  return {
    loadChecklistDetails,
    loading
  };
};
