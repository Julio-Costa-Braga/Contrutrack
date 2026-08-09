-- Adicionar colunas de localização do funcionário
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS localizacao_endereco TEXT;
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS localizacao_lat DOUBLE PRECISION;
ALTER TABLE registos_ponto ADD COLUMN IF NOT EXISTS localizacao_lon DOUBLE PRECISION;
