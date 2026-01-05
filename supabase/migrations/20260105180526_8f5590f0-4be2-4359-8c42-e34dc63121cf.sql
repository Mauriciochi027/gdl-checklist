-- Fix RLS policies for checklist_approvals and checklist_rejections
-- to use has_role() function instead of querying profiles table

-- Drop existing policies
DROP POLICY IF EXISTS "Mechanics and managers can insert approvals" ON public.checklist_approvals;
DROP POLICY IF EXISTS "Mechanics and managers can insert rejections" ON public.checklist_rejections;

-- Create new policies using has_role() function
CREATE POLICY "Mechanics and managers can insert approvals"
ON public.checklist_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'mecanico'::app_role) OR 
  has_role(auth.uid(), 'gestor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Mechanics and managers can insert rejections"
ON public.checklist_rejections
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'mecanico'::app_role) OR 
  has_role(auth.uid(), 'gestor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);