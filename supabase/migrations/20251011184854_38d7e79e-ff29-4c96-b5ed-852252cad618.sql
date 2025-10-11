-- Fix profiles table RLS policy to restrict visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create restricted policy: users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));