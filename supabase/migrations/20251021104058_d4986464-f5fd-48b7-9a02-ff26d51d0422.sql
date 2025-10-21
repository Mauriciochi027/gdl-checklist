-- Adicionar índices para otimizar performance das queries

-- Índices para checklist_records (queries mais frequentes)
CREATE INDEX IF NOT EXISTS idx_checklist_records_operator_id ON checklist_records(operator_id);
CREATE INDEX IF NOT EXISTS idx_checklist_records_status ON checklist_records(status);
CREATE INDEX IF NOT EXISTS idx_checklist_records_timestamp ON checklist_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_records_equipment_id ON checklist_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_checklist_records_status_timestamp ON checklist_records(status, timestamp DESC);

-- Índices para checklist_answers (joins frequentes)
CREATE INDEX IF NOT EXISTS idx_checklist_answers_record_id ON checklist_answers(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_answers_item_id ON checklist_answers(item_id);

-- Índices para checklist_photos (joins frequentes)
CREATE INDEX IF NOT EXISTS idx_checklist_photos_record_id ON checklist_photos(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_photos_item_id ON checklist_photos(item_id);

-- Índices para checklist_approvals (joins e filtros)
CREATE INDEX IF NOT EXISTS idx_checklist_approvals_record_id ON checklist_approvals(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_approvals_timestamp ON checklist_approvals(timestamp DESC);

-- Índices para checklist_rejections (joins e filtros)
CREATE INDEX IF NOT EXISTS idx_checklist_rejections_record_id ON checklist_rejections(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_rejections_timestamp ON checklist_rejections(timestamp DESC);

-- Índices para equipment (filtros comuns)
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_operator_id ON equipment(operator_id);

-- Índices para profiles (lookups frequentes)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_profile ON profiles(profile);

-- Comentário explicativo
COMMENT ON INDEX idx_checklist_records_status_timestamp IS 'Índice composto para otimizar queries de dashboard que filtram por status e ordenam por timestamp';