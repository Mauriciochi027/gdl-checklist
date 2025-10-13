-- Habilitar realtime para as tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_rejections;