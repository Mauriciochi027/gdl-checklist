-- Adicionar roles faltantes na tabela user_roles para usuários com perfil gestor e mecânico

-- Para todos os usuários com profile='mecanico', adicionar role 'mecanico' se não existir
INSERT INTO user_roles (user_id, role)
SELECT id, 'mecanico'::app_role 
FROM profiles 
WHERE profile = 'mecanico'
ON CONFLICT (user_id, role) DO NOTHING;

-- Para todos os usuários com profile='gestor', adicionar role 'gestor' se não existir
INSERT INTO user_roles (user_id, role)
SELECT id, 'gestor'::app_role 
FROM profiles 
WHERE profile = 'gestor'
ON CONFLICT (user_id, role) DO NOTHING;

-- Para todos os usuários com profile='admin', adicionar role 'admin' se não existir
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM profiles 
WHERE profile = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;