-- Remove a constraint antiga
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_profile_check;

-- Adiciona a nova constraint incluindo 'gestor'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_profile_check 
  CHECK (profile IN ('operador', 'mecanico', 'gestor', 'admin'));