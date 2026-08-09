-- Adicionar coluna moeda às cotações
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'EUR';
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS valor_venda NUMERIC(14,2);
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS margem_lucro NUMERIC(6,2);