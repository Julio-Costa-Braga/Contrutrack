-- Adicionar campos setor e funcao aos convites
ALTER TABLE convites ADD COLUMN IF NOT EXISTS setor TEXT;
ALTER TABLE convites ADD COLUMN IF NOT EXISTS funcao TEXT;