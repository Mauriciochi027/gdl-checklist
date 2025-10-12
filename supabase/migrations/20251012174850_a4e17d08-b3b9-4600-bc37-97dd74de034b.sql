-- Make equipment_id nullable for lifting accessory checklists
ALTER TABLE public.checklist_records 
ALTER COLUMN equipment_id DROP NOT NULL;