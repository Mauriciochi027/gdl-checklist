-- Atualizar políticas RLS para incluir gestor onde há mecanico

-- Atualizar política de aprovações de checklist para incluir gestor
DROP POLICY IF EXISTS "Mechanics can insert approvals" ON public.checklist_approvals;
CREATE POLICY "Mechanics and managers can insert approvals"
ON public.checklist_approvals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.profile = ANY(ARRAY['mecanico'::text, 'gestor'::text, 'admin'::text])
  )
);

-- Atualizar política de rejeições de checklist para incluir gestor
DROP POLICY IF EXISTS "Mechanics can insert rejections" ON public.checklist_rejections;
CREATE POLICY "Mechanics and managers can insert rejections"
ON public.checklist_rejections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.profile = ANY(ARRAY['mecanico'::text, 'gestor'::text, 'admin'::text])
  )
);

-- Atualizar política de permissões para incluir gestor
DROP POLICY IF EXISTS "Admins and mechanics can manage permissions" ON public.user_permissions;
CREATE POLICY "Admins, mechanics and managers can manage permissions"
ON public.user_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mecanico'::app_role) OR
  has_role(auth.uid(), 'gestor'::app_role)
);