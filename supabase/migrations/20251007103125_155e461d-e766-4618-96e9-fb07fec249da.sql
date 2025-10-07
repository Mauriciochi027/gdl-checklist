-- Fix infinite recursion in user_roles policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policy without recursion
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin')
);