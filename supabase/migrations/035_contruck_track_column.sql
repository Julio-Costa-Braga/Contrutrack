-- Adicionar coluna contruck_track se não existir
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS contruck_track BOOLEAN NOT NULL DEFAULT false;
