-- Tabela de integrações
CREATE TABLE IF NOT EXISTS integracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE integracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integracoes_all" ON integracoes FOR ALL USING (true) WITH CHECK (true);