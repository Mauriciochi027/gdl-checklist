-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policies that check the profiles table instead of has_role function
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.profile = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.profile = 'admin'
  )
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO public
USING (auth.uid() = user_id);