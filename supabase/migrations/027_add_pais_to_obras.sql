-- Adicionar campos de endereço detalhado à tabela obras
ALTER TABLE obras 
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Portugal',
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT;

-- Atualizar registos existentes: extrair rua e número da morada antiga se existir
UPDATE obras 
SET 
  rua = CASE 
    WHEN morada LIKE '%,%' THEN TRIM(SPLIT_PART(morada, ',', 1))
    ELSE morada
  END,
  numero = CASE 
    WHEN morada LIKE '%,%' THEN TRIM(SPLIT_PART(morada, ',', 2))
    ELSE NULL
  END
WHERE (rua IS NULL OR rua = '') AND morada IS NOT NULL;
