-- Fix FK constraint: allow deleting documentos even if referenced by alertas
ALTER TABLE alertas DROP CONSTRAINT IF EXISTS alertas_documento_id_fkey;
ALTER TABLE alertas ADD CONSTRAINT alertas_documento_id_fkey 
  FOREIGN KEY (documento_id) REFERENCES documentos_funcionario(id) ON DELETE CASCADE;
