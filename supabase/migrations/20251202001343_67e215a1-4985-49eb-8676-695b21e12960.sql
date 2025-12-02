-- Criar índices apenas se não existirem
CREATE INDEX IF NOT EXISTS idx_checklist_records_timestamp ON checklist_records(timestamp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_checklist_records_status ON checklist_records(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_records_type_status_time ON checklist_records(checklist_type, status, timestamp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_checklist_records_operator ON checklist_records(operator_id) WHERE operator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_answers_record_id ON checklist_answers(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_photos_record_id ON checklist_photos(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_approvals_record_id ON checklist_approvals(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_rejections_record_id ON checklist_rejections(checklist_record_id);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_operator ON equipment(operator_id) WHERE operator_id IS NOT NULL;

-- Atualizar estatísticas das tabelas
ANALYZE checklist_records;
ANALYZE checklist_answers;
ANALYZE checklist_photos;
ANALYZE checklist_approvals;
ANALYZE checklist_rejections;
ANALYZE equipment;