
-- Sync all existing profiles that are missing user_roles entries
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.profile::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.id IS NULL
  AND p.profile IN ('admin', 'mecanico', 'operador', 'gestor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update trigger to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile text;
BEGIN
  _profile := COALESCE(NEW.raw_user_meta_data->>'profile', 'operador');
  
  INSERT INTO public.profiles (id, username, name, profile, matricula)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    _profile,
    NEW.raw_user_meta_data->>'matricula'
  );

  -- Also create the user_role entry so RLS policies work correctly
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _profile::app_role);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Trigger error in handle_new_user: % %', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;
