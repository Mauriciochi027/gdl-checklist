-- Atualizar política RLS da tabela profiles para permitir que mecânicos vejam todos os usuários

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Criar nova política que permite mecânicos e admins verem todos os perfis
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  -- Admin pode ver todos
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Mecânico pode ver todos
  has_role(auth.uid(), 'mecanico'::app_role)
  OR
  -- Usuário pode ver o próprio perfil
  auth.uid() = id
);