-- Adicionar novos tipos de ponto
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'atestado';
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'folga';
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'ferias';
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'faltas';
