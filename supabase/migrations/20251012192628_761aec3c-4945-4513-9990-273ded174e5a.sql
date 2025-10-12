-- Adicionar 'operador' ao enum app_role se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'operador' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'operador';
  END IF;
END $$;

-- Inserir roles para todos os perfis na tabela user_roles
-- Para operadores
INSERT INTO user_roles (user_id, role)
SELECT id, 'operador'::app_role 
FROM profiles 
WHERE profile = 'operador'
ON CONFLICT (user_id, role) DO NOTHING;

-- Para mecânicos
INSERT INTO user_roles (user_id, role)
SELECT id, 'mecanico'::app_role 
FROM profiles 
WHERE profile = 'mecanico'
ON CONFLICT (user_id, role) DO NOTHING;

-- Para gestores
INSERT INTO user_roles (user_id, role)
SELECT id, 'gestor'::app_role 
FROM profiles 
WHERE profile = 'gestor'
ON CONFLICT (user_id, role) DO NOTHING;

-- Para admins
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM profiles 
WHERE profile = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;