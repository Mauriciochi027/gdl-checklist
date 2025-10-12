-- Add checklist_type column to checklist_records table
ALTER TABLE public.checklist_records 
ADD COLUMN checklist_type text NOT NULL DEFAULT 'empilhadeira';

-- Add comment to document the types
COMMENT ON COLUMN public.checklist_records.checklist_type IS 'Types: empilhadeira, cinta_icamento, manilha, gancho, corrente_icamento';