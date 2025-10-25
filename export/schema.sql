-- ============================================
-- EXPORT DO SCHEMA DO BANCO DE DADOS
-- Database: zmhczrhccztiavddabfi
-- Export Date: 2025-10-25
-- ============================================

-- Tipos customizados
CREATE TYPE app_role AS ENUM ('admin', 'mecanico', 'operador', 'gestor');

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    profile TEXT NOT NULL,
    matricula TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: equipment
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    sector TEXT NOT NULL,
    status TEXT NOT NULL,
    year INTEGER NOT NULL,
    location TEXT,
    unit TEXT,
    equipment_series TEXT,
    equipment_number TEXT,
    hour_meter TEXT,
    cost_center TEXT,
    business_unit TEXT,
    operator_id TEXT,
    operator_name TEXT,
    observations TEXT,
    photo TEXT,
    last_check TIMESTAMP WITH TIME ZONE,
    last_checklist_id UUID,
    last_operation_start TIMESTAMP WITH TIME ZONE,
    next_maintenance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: checklist_records
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID,
    equipment_code TEXT NOT NULL,
    equipment_model TEXT NOT NULL,
    equipment_model_type TEXT,
    equipment_series TEXT,
    equipment_number TEXT,
    operator_name TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    status TEXT NOT NULL,
    checklist_type TEXT NOT NULL DEFAULT 'empilhadeira',
    location TEXT,
    unit TEXT,
    hour_meter NUMERIC,
    operation_description TEXT,
    load_description TEXT,
    total_items INTEGER NOT NULL,
    conforme_items INTEGER NOT NULL,
    nao_conforme_items INTEGER NOT NULL,
    has_critical_issues BOOLEAN DEFAULT false,
    signature TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: checklist_answers
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_record_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    value TEXT NOT NULL,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: checklist_photos
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_record_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: checklist_approvals
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_record_id UUID NOT NULL,
    mechanic_name TEXT NOT NULL,
    comment TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: checklist_rejections
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_record_id UUID NOT NULL,
    mechanic_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: user_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABELA: equipment_issues
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipment_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL,
    description TEXT NOT NULL,
    photo TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- FUNÇÕES DO BANCO
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Função para criar perfil ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, profile, matricula)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'profile', 'operador'),
    NEW.raw_user_meta_data->>'matricula'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================
-- TRIGGERS
-- ============================================

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_records_updated_at
    BEFORE UPDATE ON public.checklist_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket para fotos de checklists
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', false)
ON CONFLICT (id) DO NOTHING;
