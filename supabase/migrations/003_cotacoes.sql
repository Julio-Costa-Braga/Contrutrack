-- Tabela de cotações
CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  descricao TEXT,
  documento_url TEXT,
  pais_base TEXT NOT NULL DEFAULT 'PT',
  valor_base NUMERIC(14,2) NOT NULL,
  custo_material NUMERIC(14,2),
  custo_mao_obra NUMERIC(14,2),
  lucro_estimado NUMERIC(6,2),
  valores_pais JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotacoes_all" ON cotacoes FOR ALL USING (true) WITH CHECK (true);

-- Bucket para documentos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;