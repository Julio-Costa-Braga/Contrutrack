-- Add approval columns to transacoes
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS estado_aprovacao TEXT NOT NULL DEFAULT 'pendente' CHECK (estado_aprovacao IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES perfis(id);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;
