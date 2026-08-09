-- Adicionar campo contruck_track ao registos_ponto
ALTER TABLE registos_ponto
  ADD COLUMN IF NOT EXISTS contruck_track BOOLEAN NOT NULL DEFAULT false;
