-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'mecanico', 'operador');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy to view own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for admins to manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing profile data to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, profile::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update equipment DELETE policy to use has_role
DROP POLICY IF EXISTS "Admins can delete equipment" ON public.equipment;
CREATE POLICY "Admins can delete equipment"
ON public.equipment
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for checklist_records
CREATE POLICY "Admins can delete checklist records"
ON public.checklist_records
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policies for related checklist tables
CREATE POLICY "Admins can delete checklist answers"
ON public.checklist_answers
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.checklist_records
    WHERE id = checklist_answers.checklist_record_id
  )
);

CREATE POLICY "Admins can delete checklist photos"
ON public.checklist_photos
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.checklist_records
    WHERE id = checklist_photos.checklist_record_id
  )
);

CREATE POLICY "Admins can delete checklist approvals"
ON public.checklist_approvals
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.checklist_records
    WHERE id = checklist_approvals.checklist_record_id
  )
);

CREATE POLICY "Admins can delete checklist rejections"
ON public.checklist_rejections
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.checklist_records
    WHERE id = checklist_rejections.checklist_record_id
  )
);

-- Add DELETE policy for equipment issues
CREATE POLICY "Admins can delete equipment issues"
ON public.equipment_issues
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));