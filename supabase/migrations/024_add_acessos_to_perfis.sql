-- Adicionar coluna acessos à tabela perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS acessos TEXT[] DEFAULT ARRAY['ponto'];

-- Atualizar perfis existentes baseado na função (papel)
UPDATE perfis 
SET acessos = COALESCE(f.acessos, ARRAY['ponto'])
FROM funcoes f
WHERE perfis.papel = f.id 
  AND (perfis.acessos IS NULL OR perfis.acessos = ARRAY['ponto']);

-- Garantir que todos têm pelo menos ponto
UPDATE perfis 
SET acessos = ARRAY['ponto'] 
WHERE acessos IS NULL OR NOT ('ponto' = ANY(acessos));
