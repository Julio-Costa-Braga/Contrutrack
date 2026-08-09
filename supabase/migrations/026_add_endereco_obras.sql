-- Adicionar campos de endereço detalhado à tabela obras
ALTER TABLE obras ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS codigo_postal TEXT;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS rua TEXT;

-- Atualizar a coluna morada existente para manter compatibilidade
-- (manter a coluna morada como está para não partir código existente)
