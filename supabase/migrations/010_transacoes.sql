-- Criar tabela transacoes para o financeiro
CREATE TABLE transacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao       TEXT NOT NULL,
  valor           NUMERIC(14,2) NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria      TEXT,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  obra_id        UUID REFERENCES obras(id),
  fornecedor      TEXT,
  documento      TEXT,
  criado_por     UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transacoes_all" ON transacoes FOR ALL USING (true) WITH CHECK (true);