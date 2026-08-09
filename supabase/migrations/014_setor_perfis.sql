-- Adicionar campo setor aos perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS setor TEXT;