import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, X, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'approved' | 'rejected';
  equipmentCode: string;
  mechanicName: string;
  comment?: string;
  reason?: string;
  timestamp: string;
  checklistTimestamp: string;
}

interface OperatorNotificationsProps {
  operatorName: string;
}

const DISMISSED_KEY = 'operator_dismissed_notifications';

const getDismissedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
};

const addDismissedId = (id: string) => {
  const ids = getDismissedIds();
  ids.push(id);
  // Keep only last 200 to avoid localStorage bloat
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-200)));
};

export const OperatorNotifications = ({ operatorName }: OperatorNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedIds());

  const fetchNotifications = useCallback(async () => {
    try {
      // Get operator's checklists that were responded to in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: records } = await supabase
        .from('checklist_records')
        .select('id, equipment_code, status, timestamp')
        .eq('operator_name', operatorName)
        .in('status', ['conforme', 'negado'])
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(20);

      if (!records || records.length === 0) return;

      const recordIds = records.map(r => r.id);

      const [approvalsRes, rejectionsRes] = await Promise.all([
        supabase
          .from('checklist_approvals')
          .select('id, checklist_record_id, mechanic_name, comment, timestamp')
          .in('checklist_record_id', recordIds)
          .neq('mechanic_name', 'Sistema')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('timestamp', { ascending: false }),
        supabase
          .from('checklist_rejections')
          .select('id, checklist_record_id, mechanic_name, reason, timestamp')
          .in('checklist_record_id', recordIds)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('timestamp', { ascending: false }),
      ]);

      const recordMap = new Map(records.map(r => [r.id, r]));
      const newNotifications: Notification[] = [];

      (approvalsRes.data || []).forEach(a => {
        const record = recordMap.get(a.checklist_record_id);
        if (record) {
          newNotifications.push({
            id: `approval-${a.id}`,
            type: 'approved',
            equipmentCode: record.equipment_code,
            mechanicName: a.mechanic_name,
            comment: a.comment || undefined,
            timestamp: a.timestamp,
            checklistTimestamp: record.timestamp,
          });
        }
      });

      (rejectionsRes.data || []).forEach(r => {
        const record = recordMap.get(r.checklist_record_id);
        if (record) {
          newNotifications.push({
            id: `rejection-${r.id}`,
            type: 'rejected',
            equipmentCode: record.equipment_code,
            mechanicName: r.mechanic_name,
            reason: r.reason,
            timestamp: r.timestamp,
            checklistTimestamp: record.timestamp,
          });
        }
      });

      // Sort by most recent
      newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(newNotifications);
    } catch (error) {
      console.error('[OperatorNotifications] Erro:', error);
    }
  }, [operatorName]);

  useEffect(() => {
    fetchNotifications();

    // Listen for realtime changes
    const channel = supabase
      .channel('operator-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checklist_approvals' }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checklist_rejections' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleDismiss = (id: string) => {
    addDismissedId(id);
    setDismissedIds(prev => [...prev, id]);
  };

  const handleDismissAll = () => {
    visibleNotifications.forEach(n => addDismissedId(n.id));
    setDismissedIds(prev => [...prev, ...visibleNotifications.map(n => n.id)]);
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  if (visibleNotifications.length === 0) return null;

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {visibleNotifications.length}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Respostas dos seus Checklists</h3>
        </div>
        {visibleNotifications.length > 1 && (
          <Button variant="ghost" size="sm" onClick={handleDismissAll} className="text-xs text-muted-foreground h-7">
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Notification Cards */}
      {visibleNotifications.map((notification) => {
        const isApproved = notification.type === 'approved';

        return (
          <Card
            key={notification.id}
            className={`border-2 shadow-lg animate-in slide-in-from-top-2 duration-300 ${
              isApproved
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-700'
                : 'border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isApproved
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/50'
                }`}>
                  {isApproved
                    ? <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                    : <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${
                      isApproved
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}>
                      {isApproved ? '✓ APROVADO' : '✗ NEGADO'}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-foreground mb-1">
                    Seu checklist do equipamento <span className="text-primary">{notification.equipmentCode}</span> foi {isApproved ? 'aprovado' : 'negado'}!
                  </h4>

                  <p className="text-sm text-muted-foreground mb-1">
                    Respondido por: <span className="font-medium text-foreground">{notification.mechanicName}</span>
                  </p>

                  {notification.comment && (
                    <p className="text-sm text-muted-foreground italic">
                      Comentário: "{notification.comment}"
                    </p>
                  )}

                  {notification.reason && (
                    <div className="mt-1.5 p-2 bg-red-100 dark:bg-red-900/40 rounded-md border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Motivo: {notification.reason}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Checklist: {formatDate(notification.checklistTimestamp)} • Resposta: {formatDate(notification.timestamp)}
                  </p>
                </div>

                {/* Dismiss button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(notification.id)}
                  className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
