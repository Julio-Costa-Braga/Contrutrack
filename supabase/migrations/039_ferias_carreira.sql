-- Tabela de férias programadas para funcionários
CREATE TABLE IF NOT EXISTS ferias_funcionario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id  UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data_inicio     DATE NOT NULL,
  data_fim        DATE NOT NULL,
  dias_uteis      INTEGER NOT NULL DEFAULT 0,
  estado          TEXT NOT NULL DEFAULT 'agendado' CHECK (estado IN ('agendado', 'aprovado', 'cancelado', 'gozado')),
  observacoes     TEXT,
  aprovado_por    UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT data_valida CHECK (data_fim >= data_inicio)
);

-- Adicionar campos de carreira ao funcionário (se não existirem)
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS setor TEXT;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS categoria_profissional TEXT;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS nivel TEXT;

-- RLS
ALTER TABLE ferias_funcionario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ferias_funcionario_select" ON ferias_funcionario
  FOR SELECT USING (true);

CREATE POLICY "ferias_funcionario_insert" ON ferias_funcionario
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ferias_funcionario_update" ON ferias_funcionario
  FOR UPDATE USING (true);

CREATE POLICY "ferias_funcionario_delete" ON ferias_funcionario
  FOR DELETE USING (true);
