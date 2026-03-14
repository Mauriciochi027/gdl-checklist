import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { keysToCamelCase } from '@/lib/utils';
import { Equipment } from '@/types/equipment';
import { 
  QUERY_KEYS, CACHE_TIMES, EQUIPMENT_LIGHT_COLUMNS, 
  CHECKLIST_LIGHT_COLUMNS, withTiming 
} from '@/lib/queryConfig';

/**
 * Prefetch critical data right after authentication.
 * Uses light columns to minimize payload and speed up initial load.
 */
export const usePrefetchData = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const prefetch = async () => {
      const start = performance.now();
      console.log('[Prefetch] Starting optimized data prefetch...');

      await Promise.allSettled([
        // Equipment - light payload (no photos)
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.equipment,
          queryFn: () => withTiming('prefetch:equipment', async () => {
            const allData: any[] = [];
            const batchSize = 1000;
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
              const { data, error } = await supabase
                .from('equipment')
                .select(EQUIPMENT_LIGHT_COLUMNS)
                .order('code', { ascending: true })
                .range(offset, offset + batchSize - 1);

              if (error) throw error;
              if (data && data.length > 0) {
                allData.push(...data);
                offset += batchSize;
                hasMore = data.length === batchSize;
              } else {
                hasMore = false;
              }
            }
            return keysToCamelCase<Equipment[]>(allData);
          }),
          staleTime: CACHE_TIMES.equipment.staleTime,
        }),

        // Checklists - light columns, limited, with parallel sub-queries
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.checklists,
          queryFn: () => withTiming('prefetch:checklists', async () => {
            const { data: records, error } = await supabase
              .from('checklist_records')
              .select(CHECKLIST_LIGHT_COLUMNS)
              .order('timestamp', { ascending: false })
              .limit(200);

            if (error) throw error;
            if (!records || records.length === 0) return [];

            const recordIds = records.map(r => r.id);

            // Fetch only needed columns from approvals/rejections
            const [approvalsResult, rejectionsResult] = await Promise.all([
              supabase.from('checklist_approvals')
                .select('checklist_record_id,mechanic_name,timestamp,comment')
                .in('checklist_record_id', recordIds),
              supabase.from('checklist_rejections')
                .select('checklist_record_id,mechanic_name,timestamp,reason')
                .in('checklist_record_id', recordIds),
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
          }),
          staleTime: CACHE_TIMES.checklists.staleTime,
        }),
      ]);

      console.log(`[Prefetch] Completed in ${Math.round(performance.now() - start)}ms`);
    };

    prefetch();
  }, [userId, queryClient]);
};
