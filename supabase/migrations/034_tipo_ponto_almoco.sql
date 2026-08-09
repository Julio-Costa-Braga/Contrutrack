-- Adicionar novos tipos de ponto
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'entrada_almoco';
ALTER TYPE tipo_ponto ADD VALUE IF NOT EXISTS 'retorno_almoco';
