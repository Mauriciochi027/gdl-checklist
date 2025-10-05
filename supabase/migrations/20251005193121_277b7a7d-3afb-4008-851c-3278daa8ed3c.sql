-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile TEXT NOT NULL CHECK (profile IN ('operador', 'mecanico', 'admin')),
  matricula TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  sector TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive', 'operando', 'disponivel')),
  last_check TIMESTAMPTZ,
  next_maintenance TIMESTAMPTZ,
  observations TEXT,
  photo TEXT,
  operator_name TEXT,
  operator_id TEXT,
  location TEXT,
  unit TEXT,
  equipment_series TEXT,
  equipment_number TEXT,
  hour_meter TEXT,
  cost_center TEXT,
  business_unit TEXT,
  last_checklist_id UUID,
  last_operation_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Anyone can view equipment"
  ON public.equipment FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert equipment"
  ON public.equipment FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update equipment"
  ON public.equipment FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete equipment"
  ON public.equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND profile = 'admin'
    )
  );

-- Create checklist_records table
CREATE TABLE public.checklist_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  equipment_code TEXT NOT NULL,
  equipment_model TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('conforme', 'pendente', 'negado')),
  total_items INTEGER NOT NULL,
  conforme_items INTEGER NOT NULL,
  nao_conforme_items INTEGER NOT NULL,
  signature TEXT NOT NULL,
  has_critical_issues BOOLEAN DEFAULT false,
  equipment_model_type TEXT,
  location TEXT,
  unit TEXT,
  equipment_series TEXT,
  equipment_number TEXT,
  hour_meter NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_records ENABLE ROW LEVEL SECURITY;

-- Checklist records policies
CREATE POLICY "Anyone can view checklist records"
  ON public.checklist_records FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert checklist records"
  ON public.checklist_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checklist records"
  ON public.checklist_records FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create checklist_answers table
CREATE TABLE public.checklist_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_record_id UUID NOT NULL REFERENCES public.checklist_records(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  value TEXT NOT NULL CHECK (value IN ('sim', 'nao', 'nao_aplica')),
  observation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_answers ENABLE ROW LEVEL SECURITY;

-- Checklist answers policies
CREATE POLICY "Anyone can view checklist answers"
  ON public.checklist_answers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert checklist answers"
  ON public.checklist_answers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create checklist_photos table
CREATE TABLE public.checklist_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_record_id UUID NOT NULL REFERENCES public.checklist_records(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_photos ENABLE ROW LEVEL SECURITY;

-- Checklist photos policies
CREATE POLICY "Anyone can view checklist photos"
  ON public.checklist_photos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert checklist photos"
  ON public.checklist_photos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create checklist_approvals table
CREATE TABLE public.checklist_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_record_id UUID NOT NULL REFERENCES public.checklist_records(id) ON DELETE CASCADE,
  mechanic_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_approvals ENABLE ROW LEVEL SECURITY;

-- Checklist approvals policies
CREATE POLICY "Anyone can view checklist approvals"
  ON public.checklist_approvals FOR SELECT
  USING (true);

CREATE POLICY "Mechanics can insert approvals"
  ON public.checklist_approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND profile IN ('mecanico', 'admin')
    )
  );

-- Create checklist_rejections table
CREATE TABLE public.checklist_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_record_id UUID NOT NULL REFERENCES public.checklist_records(id) ON DELETE CASCADE,
  mechanic_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_rejections ENABLE ROW LEVEL SECURITY;

-- Checklist rejections policies
CREATE POLICY "Anyone can view checklist rejections"
  ON public.checklist_rejections FOR SELECT
  USING (true);

CREATE POLICY "Mechanics can insert rejections"
  ON public.checklist_rejections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND profile IN ('mecanico', 'admin')
    )
  );

-- Create equipment_issues table
CREATE TABLE public.equipment_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_issues ENABLE ROW LEVEL SECURITY;

-- Equipment issues policies
CREATE POLICY "Anyone can view equipment issues"
  ON public.equipment_issues FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert equipment issues"
  ON public.equipment_issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_records_updated_at
  BEFORE UPDATE ON public.checklist_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();