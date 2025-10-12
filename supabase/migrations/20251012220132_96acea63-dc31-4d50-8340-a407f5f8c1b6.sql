-- ============================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ============================================

-- 1. CORRIGIR POLÍTICA DE user_roles (CRÍTICO)
-- Problema: Usuários podem modificar seus próprios roles
-- Solução: Apenas admins podem gerenciar roles

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. CORRIGIR POLÍTICA DE user_permissions (CRÍTICO)
-- Problema: Mecânicos e gestores podem modificar permissões
-- Solução: Apenas admins podem modificar permissões

DROP POLICY IF EXISTS "Admins, mechanics and managers can manage permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;

-- Políticas separadas para cada operação
CREATE POLICY "Only admins can insert permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update permissions"
ON public.user_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete permissions"
ON public.user_permissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and mechanics can view permissions"
ON public.user_permissions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR auth.uid() = user_id
);

-- 3. RESTRINGIR VISUALIZAÇÃO DE PERFIS (ALTO RISCO)
-- Problema: Todos podem ver dados pessoais de outros usuários
-- Solução: Apenas admins, mecânicos e o próprio usuário podem ver perfis

DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Restricted profile viewing"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'mecanico'::app_role)
  OR auth.uid() = id
);

-- 4. GARANTIR QUE USUÁRIOS NÃO PODEM MUDAR SEU PRÓPRIO PERFIL/ROLE
DROP POLICY IF EXISTS "Users can update own profile data only" ON public.profiles;

CREATE POLICY "Users can update own basic data only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND profile = (SELECT profile FROM profiles WHERE id = auth.uid())
  AND username = (SELECT username FROM profiles WHERE id = auth.uid())
);