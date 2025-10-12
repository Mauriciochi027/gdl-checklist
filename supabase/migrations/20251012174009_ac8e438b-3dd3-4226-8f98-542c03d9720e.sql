-- Add fields for operation description and load for lifting accessory checklists
ALTER TABLE public.checklist_records 
ADD COLUMN operation_description TEXT,
ADD COLUMN load_description TEXT;