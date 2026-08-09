-- Adicionar colunas de morada ao registos_ponto
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS codigo_postal TEXT;
