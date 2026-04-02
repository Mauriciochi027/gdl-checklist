
-- FIX 1: Hardcode 'operador' in handle_new_user to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, profile, matricula)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    'operador',
    NEW.raw_user_meta_data->>'matricula'
  );
  RETURN NEW;
END;
$$;

-- FIX 2: Fix user_roles management policy to use has_role() instead of profiles.profile
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- FIX 3: Restrict checklist_records UPDATE to privileged roles only
DROP POLICY IF EXISTS "Authenticated users can update checklist records" ON public.checklist_records;
CREATE POLICY "Privileged users can update checklist records"
ON public.checklist_records
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
);

-- FIX 4: Restrict checklist_records SELECT - operators see only their own
DROP POLICY IF EXISTS "Authenticated users can view checklist records" ON public.checklist_records;
CREATE POLICY "Role-scoped checklist record access"
ON public.checklist_records
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR operator_id = (SELECT matricula FROM profiles WHERE id = auth.uid())
);

-- FIX 5: Scope related checklist tables similarly
-- checklist_answers SELECT
DROP POLICY IF EXISTS "Authenticated users can view checklist answers" ON public.checklist_answers;
CREATE POLICY "Role-scoped checklist answers access"
ON public.checklist_answers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM checklist_records cr
    WHERE cr.id = checklist_answers.checklist_record_id
    AND cr.operator_id = (SELECT matricula FROM profiles WHERE id = auth.uid())
  )
);

-- checklist_photos SELECT
DROP POLICY IF EXISTS "Authenticated users can view checklist photos" ON public.checklist_photos;
CREATE POLICY "Role-scoped checklist photos access"
ON public.checklist_photos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM checklist_records cr
    WHERE cr.id = checklist_photos.checklist_record_id
    AND cr.operator_id = (SELECT matricula FROM profiles WHERE id = auth.uid())
  )
);

-- checklist_approvals SELECT
DROP POLICY IF EXISTS "Authenticated users can view checklist approvals" ON public.checklist_approvals;
CREATE POLICY "Role-scoped checklist approvals access"
ON public.checklist_approvals
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM checklist_records cr
    WHERE cr.id = checklist_approvals.checklist_record_id
    AND cr.operator_id = (SELECT matricula FROM profiles WHERE id = auth.uid())
  )
);

-- checklist_rejections SELECT
DROP POLICY IF EXISTS "Authenticated users can view checklist rejections" ON public.checklist_rejections;
CREATE POLICY "Role-scoped checklist rejections access"
ON public.checklist_rejections
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM checklist_records cr
    WHERE cr.id = checklist_rejections.checklist_record_id
    AND cr.operator_id = (SELECT matricula FROM profiles WHERE id = auth.uid())
  )
);
