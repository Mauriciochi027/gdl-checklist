-- Remover a constraint antiga
ALTER TABLE equipment DROP CONSTRAINT equipment_status_check;

-- Adicionar nova constraint com os valores em português e inglês
ALTER TABLE equipment ADD CONSTRAINT equipment_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'manutencao'::text, 'inactive'::text, 'operando'::text, 'disponivel'::text]));