-- Adicionar coluna nivel à tabela de funções/cargos
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT '';
