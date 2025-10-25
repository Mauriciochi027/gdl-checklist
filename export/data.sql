-- ============================================
-- EXPORT DOS DADOS DO BANCO DE DADOS
-- Database: zmhczrhccztiavddabfi
-- Export Date: 2025-10-25
-- ============================================

-- ============================================
-- DADOS: profiles
-- ============================================
INSERT INTO public.profiles (id, username, name, profile, matricula, created_at, updated_at) VALUES
('783c24ec-17ed-49c6-9979-dc04323d88e1', 'cassio.oliveira', 'Cássio Oliveira', 'admin', '1454', '2025-10-12 19:50:32.038594+00', '2025-10-12 20:01:27.73638+00'),
('a26000c9-6e4f-484e-8e12-bfcbbe079963', 'mauro.vinicius', 'Mauro Vinicius Pereira', 'mecanico', NULL, '2025-10-13 20:34:08.650901+00', '2025-10-13 20:34:08.650901+00'),
('d5e09a7c-a8e7-4bc1-b59b-81c5c3519ab3', 'rodrigo.siqueira', 'Rodrigo Siqueira Rodrigues', 'operador', '1268', '2025-10-20 22:21:45.847542+00', '2025-10-20 22:47:31.991829+00'),
('79fdbc99-9c18-4454-b8c4-aba466e11103', 'jovelino.zambom', 'Jovelino Zambom Paulo', 'operador', '805', '2025-10-21 15:22:36.539298+00', '2025-10-21 15:22:36.539298+00');

-- ============================================
-- DADOS: equipment
-- ============================================
-- NOTA: A foto em base64 foi omitida devido ao tamanho. 
-- Ver arquivo database-export.json para dados completos.
INSERT INTO public.equipment (id, code, brand, model, sector, status, year, location, unit, equipment_series, equipment_number, hour_meter, cost_center, operator_id, operator_name, observations, last_check, created_at, updated_at) VALUES
('0e8e333f-16d4-47c7-8417-0f32b4597bb5', 'EMP-RS330', 'Sany', 'SRSC45H3', 'Aduaneiro - Unidade 01', 'operando', 2024, 'Aduaneiro - Unidade 01', 'Unidade 01', 'RS4502CE0232', '330', '0', '102101', 'MEC001', 'Carlos Oliveira', 'Equipamento operando normalmente.', '2025-10-08 00:00:00+00', '2025-10-08 15:34:25.889368+00', '2025-10-08 15:34:25.889368+00');

-- ============================================
-- DADOS: user_roles
-- ============================================
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('59920711-d712-48e5-81e7-ecfed3e4787e', '783c24ec-17ed-49c6-9979-dc04323d88e1', 'admin', '2025-10-12 19:17:48.936251+00');

-- ============================================
-- DADOS: user_permissions
-- ============================================
INSERT INTO public.user_permissions (id, user_id, permission, created_at, updated_at) VALUES
('262e8935-8cc4-4d28-8e3d-5b6795933ca3', 'd5e09a7c-a8e7-4bc1-b59b-81c5c3519ab3', 'checklist', '2025-10-20 22:47:32.846495+00', '2025-10-20 22:47:32.846495+00'),
('0175336b-3f53-4599-8618-67c5f254aa43', 'd5e09a7c-a8e7-4bc1-b59b-81c5c3519ab3', 'history', '2025-10-20 22:47:32.846495+00', '2025-10-20 22:47:32.846495+00'),
('0494dd1b-f45d-4b69-b3a8-d2d883455f4f', 'd5e09a7c-a8e7-4bc1-b59b-81c5c3519ab3', 'dashboard', '2025-10-20 22:47:32.846495+00', '2025-10-20 22:47:32.846495+00'),
('4f7d6aa2-4948-459b-a5a3-fe997b72dbf9', 'd5e09a7c-a8e7-4bc1-b59b-81c5c3519ab3', 'status', '2025-10-20 22:47:32.846495+00', '2025-10-20 22:47:32.846495+00');

-- ============================================
-- ESTATÍSTICAS DO EXPORT
-- ============================================
-- Total de registros por tabela:
-- profiles: 4 registros
-- equipment: 1 registro
-- user_roles: 1 registro
-- user_permissions: 4 registros
-- checklist_records: 0 registros
-- checklist_answers: 0 registros
-- checklist_photos: 0 registros
-- checklist_approvals: 0 registros
-- checklist_rejections: 0 registros
-- equipment_issues: 0 registros
