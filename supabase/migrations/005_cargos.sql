-- Tabela de cargos personalizados
CREATE TABLE IF NOT EXISTS cargos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  acessos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargos_all" ON cargos FOR ALL USING (true) WITH CHECK (true);

-- Inserir alguns cargos de exemplo
INSERT INTO cargos (id, nome, acessos) VALUES
  ('tecnico_seguranca', 'Técnico de Segurança', ARRAY['dashboard', 'ponto', 'rh']),
  ('estor', 'Estagiário', ARRAY['dashboard']),
  ('secretaria', 'Secretária', ARRAY['dashboard', 'compras'])
ON CONFLICT (id) DO NOTHING;