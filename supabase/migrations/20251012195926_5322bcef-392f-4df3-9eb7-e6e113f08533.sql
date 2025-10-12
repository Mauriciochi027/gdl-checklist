-- Atualizar a role do usuário cassio.oliveira para admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '783c24ec-17ed-49c6-9979-dc04323d88e1' AND role = 'operador';