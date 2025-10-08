-- =====================================================
-- CRITICAL SECURITY FIX: Restrict Public Data Access
-- =====================================================

-- Phase 1: Fix all public SELECT policies to require authentication

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Anyone can view checklist records" ON public.checklist_records;
DROP POLICY IF EXISTS "Anyone can view checklist answers" ON public.checklist_answers;
DROP POLICY IF EXISTS "Anyone can view checklist photos" ON public.checklist_photos;
DROP POLICY IF EXISTS "Anyone can view checklist approvals" ON public.checklist_approvals;
DROP POLICY IF EXISTS "Anyone can view checklist rejections" ON public.checklist_rejections;
DROP POLICY IF EXISTS "Anyone can view equipment issues" ON public.equipment_issues;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restricted SELECT policies requiring authentication
CREATE POLICY "Authenticated users can view equipment"
ON public.equipment
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view checklist records"
ON public.checklist_records
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view checklist answers"
ON public.checklist_answers
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view checklist photos"
ON public.checklist_photos
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view checklist approvals"
ON public.checklist_approvals
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view checklist rejections"
ON public.checklist_rejections
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view equipment issues"
ON public.equipment_issues
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- CRITICAL SECURITY FIX: Prevent Privilege Escalation
-- =====================================================

-- Drop existing profile update policy that allows changing roles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policy that prevents users from changing their role
CREATE POLICY "Users can update own profile data only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from changing their profile/role
  profile = (SELECT profile FROM public.profiles WHERE id = auth.uid())
);

-- =====================================================
-- Additional Security: Add admin-only user management
-- =====================================================

-- Allow admins to manage all profiles for user management
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));