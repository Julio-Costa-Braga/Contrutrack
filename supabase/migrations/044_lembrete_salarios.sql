-- Add lembrete (reminder) columns to transacoes
-- Add lembrete (reminder) columns to transacoes
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS lembrete BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS lembrete_dias INTEGER DEFAULT 0;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recorrente BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recorrente_tipo TEXT CHECK (recorrente_tipo IN ('mensal', 'trimestral', 'anual'));
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES funcionarios(id);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS mes_referencia TEXT;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS requisicao_id UUID REFERENCES requisicoes(id) ON DELETE SET NULL;
