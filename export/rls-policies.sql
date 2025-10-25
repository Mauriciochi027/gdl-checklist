-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Database: zmhczrhccztiavddabfi
-- Export Date: 2025-10-25
-- ============================================

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_issues ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: profiles
-- ============================================

-- Admins podem gerenciar todos os perfis
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Visualização restrita de perfis
CREATE POLICY "Restricted profile viewing"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mecanico'::app_role) OR 
  auth.uid() = id
);

-- Usuários podem atualizar apenas seus próprios dados básicos
CREATE POLICY "Users can update own basic data only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  profile = (SELECT profile FROM profiles WHERE id = auth.uid()) AND
  username = (SELECT username FROM profiles WHERE id = auth.uid())
);

-- ============================================
-- POLICIES: equipment
-- ============================================

-- Usuários autenticados podem ver equipamentos
CREATE POLICY "Authenticated users can view equipment"
ON public.equipment
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem inserir equipamentos
CREATE POLICY "Authenticated users can insert equipment"
ON public.equipment
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários autenticados podem atualizar equipamentos
CREATE POLICY "Authenticated users can update equipment"
ON public.equipment
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar equipamentos
CREATE POLICY "Admins can delete equipment"
ON public.equipment
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- POLICIES: checklist_records
-- ============================================

-- Usuários autenticados podem ver checklists
CREATE POLICY "Authenticated users can view checklist records"
ON public.checklist_records
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem inserir checklists
CREATE POLICY "Authenticated users can insert checklist records"
ON public.checklist_records
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários autenticados podem atualizar checklists
CREATE POLICY "Authenticated users can update checklist records"
ON public.checklist_records
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar checklists
CREATE POLICY "Admins can delete checklist records"
ON public.checklist_records
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- POLICIES: checklist_answers
-- ============================================

-- Usuários autenticados podem ver respostas
CREATE POLICY "Authenticated users can view checklist answers"
ON public.checklist_answers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem inserir respostas
CREATE POLICY "Authenticated users can insert checklist answers"
ON public.checklist_answers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar respostas
CREATE POLICY "Admins can delete checklist answers"
ON public.checklist_answers
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM checklist_records WHERE id = checklist_record_id)
);

-- ============================================
-- POLICIES: checklist_photos
-- ============================================

-- Usuários autenticados podem ver fotos
CREATE POLICY "Authenticated users can view checklist photos"
ON public.checklist_photos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem inserir fotos
CREATE POLICY "Authenticated users can insert checklist photos"
ON public.checklist_photos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar fotos
CREATE POLICY "Admins can delete checklist photos"
ON public.checklist_photos
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM checklist_records WHERE id = checklist_record_id)
);

-- ============================================
-- POLICIES: checklist_approvals
-- ============================================

-- Usuários autenticados podem ver aprovações
CREATE POLICY "Authenticated users can view checklist approvals"
ON public.checklist_approvals
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Mecânicos e gestores podem inserir aprovações
CREATE POLICY "Mechanics and managers can insert approvals"
ON public.checklist_approvals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND profile IN ('mecanico', 'gestor', 'admin')
  )
);

-- Apenas admins podem deletar aprovações
CREATE POLICY "Admins can delete checklist approvals"
ON public.checklist_approvals
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM checklist_records WHERE id = checklist_record_id)
);

-- ============================================
-- POLICIES: checklist_rejections
-- ============================================

-- Usuários autenticados podem ver rejeições
CREATE POLICY "Authenticated users can view checklist rejections"
ON public.checklist_rejections
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Mecânicos e gestores podem inserir rejeições
CREATE POLICY "Mechanics and managers can insert rejections"
ON public.checklist_rejections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND profile IN ('mecanico', 'gestor', 'admin')
  )
);

-- Apenas admins podem deletar rejeições
CREATE POLICY "Admins can delete checklist rejections"
ON public.checklist_rejections
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM checklist_records WHERE id = checklist_record_id)
);

-- ============================================
-- POLICIES: user_roles
-- ============================================

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem gerenciar todas as roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND profile = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND profile = 'admin'
  )
);

-- ============================================
-- POLICIES: user_permissions
-- ============================================

-- Admins e mecânicos podem ver permissões
CREATE POLICY "Admins and mechanics can view permissions"
ON public.user_permissions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'mecanico'::app_role) OR 
  auth.uid() = user_id
);

-- Apenas admins podem inserir permissões
CREATE POLICY "Only admins can insert permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar permissões
CREATE POLICY "Only admins can update permissions"
ON public.user_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar permissões
CREATE POLICY "Only admins can delete permissions"
ON public.user_permissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- POLICIES: equipment_issues
-- ============================================

-- Usuários autenticados podem ver problemas
CREATE POLICY "Authenticated users can view equipment issues"
ON public.equipment_issues
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem inserir problemas
CREATE POLICY "Authenticated users can insert equipment issues"
ON public.equipment_issues
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar problemas
CREATE POLICY "Admins can delete equipment issues"
ON public.equipment_issues
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- STORAGE POLICIES: checklist-photos
-- ============================================

-- Permitir inserção de fotos para usuários autenticados
CREATE POLICY "Authenticated users can upload checklist photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'checklist-photos' AND
  auth.uid() IS NOT NULL
);

-- Permitir visualização de fotos para usuários autenticados
CREATE POLICY "Authenticated users can view checklist photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'checklist-photos' AND
  auth.uid() IS NOT NULL
);

-- Permitir deleção de fotos para admins
CREATE POLICY "Admins can delete checklist photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'checklist-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);
