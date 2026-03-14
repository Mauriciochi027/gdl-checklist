import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keysToCamelCase } from '@/lib/utils';
import { withTiming } from '@/lib/queryConfig';

/**
 * Hook para carregar detalhes de um checklist específico sob demanda.
 * All 4 queries run in parallel for maximum speed.
 */
export const useChecklistDetails = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [cache, setCache] = useState<Record<string, any>>({});

  const loadChecklistDetails = useCallback(async (recordId: string) => {
    // Return cached data if available
    if (cache[recordId]) return cache[recordId];
    
    try {
      setLoading(prev => ({ ...prev, [recordId]: true }));
      
      const result = await withTiming(`checklistDetails:${recordId.slice(0, 8)}`, async () => {
        // ALL queries in parallel
        const [answersRes, photosRes, approvalsRes, rejectionsRes] = await Promise.all([
          supabase.from('checklist_answers')
            .select('item_id,value,observation')
            .eq('checklist_record_id', recordId),
          supabase.from('checklist_photos')
            .select('item_id,photo_url')
            .eq('checklist_record_id', recordId),
          supabase.from('checklist_approvals')
            .select('mechanic_name,timestamp,comment')
            .eq('checklist_record_id', recordId),
          supabase.from('checklist_rejections')
            .select('mechanic_name,timestamp,reason')
            .eq('checklist_record_id', recordId),
        ]);

        if (answersRes.error) throw answersRes.error;
        if (photosRes.error) throw photosRes.error;
        if (approvalsRes.error) throw approvalsRes.error;
        if (rejectionsRes.error) throw rejectionsRes.error;

        const photosByItem: Record<string, string[]> = {};
        photosRes.data?.forEach((photo: any) => {
          const camelPhoto = keysToCamelCase(photo);
          if (!photosByItem[camelPhoto.itemId]) photosByItem[camelPhoto.itemId] = [];
          photosByItem[camelPhoto.itemId].push(camelPhoto.photoUrl);
        });

        return {
          checklistAnswers: answersRes.data?.map(a => keysToCamelCase(a)) || [],
          photos: photosByItem,
          checklistApprovals: approvalsRes.data?.map(a => keysToCamelCase(a)) || [],
          checklistRejections: rejectionsRes.data?.map(r => keysToCamelCase(r)) || []
        };
      });

      // Cache the result
      setCache(prev => ({ ...prev, [recordId]: result }));
      return result;
    } catch (error) {
      console.error('[useChecklistDetails] Erro:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [recordId]: false }));
    }
  }, [cache]);

  const clearCache = useCallback((recordId?: string) => {
    if (recordId) {
      setCache(prev => {
        const next = { ...prev };
        delete next[recordId];
        return next;
      });
    } else {
      setCache({});
    }
  }, []);

  return { loadChecklistDetails, loading, clearCache };
};
