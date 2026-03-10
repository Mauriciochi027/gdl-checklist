import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { keysToCamelCase } from '@/lib/utils';
import { Equipment } from '@/types/equipment';

const EQUIPMENT_KEY = ['equipment'] as const;
const CHECKLISTS_KEY = ['checklists'] as const;

/**
 * Prefetch critical data right after authentication.
 * This ensures data is already in React Query cache before components mount.
 */
export const usePrefetchData = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Prefetch equipment and checklists in parallel immediately
    const prefetch = async () => {
      const start = performance.now();
      console.log('[Prefetch] Starting data prefetch...');

      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: EQUIPMENT_KEY,
          queryFn: async () => {
            const allData: any[] = [];
            const batchSize = 1000;
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
              const { data, error } = await supabase
                .from('equipment')
                .select('*')
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
          },
          staleTime: 5 * 60 * 1000,
        }),

        queryClient.prefetchQuery({
          queryKey: CHECKLISTS_KEY,
          queryFn: async () => {
            const { data: records, error } = await supabase
              .from('checklist_records')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(200);

            if (error) throw error;
            if (!records || records.length === 0) return [];

            const recordIds = records.map(r => r.id);

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
          },
          staleTime: 2 * 60 * 1000,
        }),
      ]);

      console.log(`[Prefetch] Completed in ${Math.round(performance.now() - start)}ms`);
    };

    prefetch();
  }, [userId, queryClient]);
};
