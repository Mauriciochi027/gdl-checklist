-- Garantir que gestores tenham as mesmas permissões que mecânicos no sistema

-- Adicionar role de gestor para usuários que precisam
-- (caso exista um mecânico que deve ser gestor, adicione manualmente)

-- Verificar e atualizar políticas que podem estar bloqueando gestores
-- Não é necessário alterar políticas de equipment, checklist_records, etc
-- pois elas já permitem authenticated users

-- Apenas garantir que a função has_role funcione corretamente para gestor
-- A função já existe e funciona, então vamos apenas verificar se há algum usuário
-- que precise ter a role de gestor adicionada na tabela user_roles

-- Exemplo: Se o usuário mecanico1 precisa ser gestor:
-- INSERT INTO user_roles (user_id, role) 
-- SELECT id, 'gestor'::app_role FROM profiles WHERE username = 'mecanico1'
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Por enquanto, vamos apenas garantir que não há bloqueios
-- As políticas de equipment já permitem auth.uid() IS NOT NULL

-- Verificação: As políticas atuais de equipment são:
-- SELECT: auth.uid() IS NOT NULL ✓
-- INSERT: auth.uid() IS NOT NULL ✓
-- UPDATE: auth.uid() IS NOT NULL ✓
-- DELETE: has_role(auth.uid(), 'admin'::app_role) ✓

-- Isso significa que qualquer usuário autenticado (incluindo gestor) 
-- já pode ver, inserir e atualizar equipamentos

-- Vamos apenas adicionar um comentário de confirmação
COMMENT ON TABLE equipment IS 'Table accessible by all authenticated users for read/write operations';