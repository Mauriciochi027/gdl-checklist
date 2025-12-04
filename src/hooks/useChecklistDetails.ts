import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keysToCamelCase } from '@/lib/utils';

/**
 * Hook para carregar detalhes de um checklist específico sob demanda
 */
export const useChecklistDetails = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const loadChecklistDetails = useCallback(async (recordId: string) => {
    try {
      setLoading(prev => ({ ...prev, [recordId]: true }));
      
      // Carregar answers
      const { data: answers, error: answersError } = await supabase
        .from('checklist_answers')
        .select('*')
        .eq('checklist_record_id', recordId);

      if (answersError) throw answersError;

      // Carregar photos
      const { data: photos, error: photosError } = await supabase
        .from('checklist_photos')
        .select('*')
        .eq('checklist_record_id', recordId);

      if (photosError) throw photosError;

      // Carregar approvals
      const { data: approvals, error: approvalsError } = await supabase
        .from('checklist_approvals')
        .select('*')
        .eq('checklist_record_id', recordId);

      if (approvalsError) throw approvalsError;

      // Carregar rejections
      const { data: rejections, error: rejectionsError } = await supabase
        .from('checklist_rejections')
        .select('*')
        .eq('checklist_record_id', recordId);

      if (rejectionsError) throw rejectionsError;

      // Transformar dados
      const photosByItem: Record<string, string[]> = {};
      photos?.forEach((photo: any) => {
        const camelPhoto = keysToCamelCase(photo);
        if (!photosByItem[camelPhoto.itemId]) photosByItem[camelPhoto.itemId] = [];
        photosByItem[camelPhoto.itemId].push(camelPhoto.photoUrl);
      });

      return {
        checklistAnswers: answers?.map(a => keysToCamelCase(a)) || [],
        photos: photosByItem,
        checklistApprovals: approvals?.map(a => keysToCamelCase(a)) || [],
        checklistRejections: rejections?.map(r => keysToCamelCase(r)) || []
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
