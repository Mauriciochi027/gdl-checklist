-- Criar tabela de pneus
CREATE TABLE public.tires (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  model text,
  status text NOT NULL DEFAULT 'estoque' CHECK (status IN ('estoque', 'em_uso', 'em_reforma')),
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  position text,
  initial_depth numeric(5,2),
  initial_hour_meter numeric(10,2),
  mounted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de medições de desgaste
CREATE TABLE public.tire_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tire_id uuid NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE,
  depth numeric(5,2) NOT NULL,
  measured_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  measured_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tire_measurements ENABLE ROW LEVEL SECURITY;

-- Políticas para tires - apenas admin pode gerenciar, outros podem visualizar
CREATE POLICY "Admins can manage tires"
ON public.tires
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view tires"
ON public.tires
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas para tire_measurements - apenas admin pode gerenciar
CREATE POLICY "Admins can manage tire measurements"
ON public.tire_measurements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view tire measurements"
ON public.tire_measurements
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_tires_updated_at
BEFORE UPDATE ON public.tires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();