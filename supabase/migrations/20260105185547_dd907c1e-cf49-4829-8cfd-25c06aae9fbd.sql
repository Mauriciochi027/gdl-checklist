-- Fix 1: Add explicit authentication requirement for profiles table
-- Drop and recreate the viewing policy to be more explicit with authentication
DROP POLICY IF EXISTS "Restricted profile viewing" ON public.profiles;

CREATE POLICY "Restricted profile viewing"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'mecanico'::app_role)
    OR auth.uid() = id
  )
);

-- Explicitly deny anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix 2: Restrict equipment INSERT and UPDATE to admin and mechanic roles
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON public.equipment;

-- Restrict INSERT to admins and mechanics
CREATE POLICY "Admins and mechanics can insert equipment"
ON public.equipment
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'mecanico'::app_role)
);

-- Restrict UPDATE to admins and mechanics
CREATE POLICY "Admins and mechanics can update equipment"
ON public.equipment
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'mecanico'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'mecanico'::app_role)
);