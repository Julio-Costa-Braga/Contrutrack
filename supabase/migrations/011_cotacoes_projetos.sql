-- Tabela para cotacoes de projetos/obras por pais
CREATE TABLE IF NOT EXISTS cotacoes_projetos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente         TEXT NOT NULL,
  descricao       TEXT,
  documento_url  TEXT,
  pais_base       TEXT NOT NULL DEFAULT 'PT',
  moeda           TEXT NOT NULL DEFAULT 'EUR',
  valor_base     NUMERIC(14,2),
  valores_pais    JSONB,
  lucro_estimado NUMERIC(6,2),
  custo_mao_obra  NUMERIC(14,2),
  custo_material  NUMERIC(14,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cotacoes_projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotacoes_projetos_all" ON cotacoes_projetos FOR ALL USING (true) WITH CHECK (true);