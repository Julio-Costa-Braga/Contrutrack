-- Tabela de setores
CREATE TABLE IF NOT EXISTS setores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de funções
CREATE TABLE IF NOT EXISTS funcoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  acessos TEXT[] DEFAULT ARRAY['dashboard'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna setor aos perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS setor TEXT;

-- Inserir setores de exemplo
INSERT INTO setores (id, nome) VALUES
  ('administracao', 'Administração'),
  ('recursos_humanos', 'Recursos Humanos'),
  ('financeiro', 'Financeiro'),
  ('engenharia', 'Engenharia'),
  ('obras', 'Obras'),
  ('compras', 'Compras'),
  ('seguranca', 'Segurança do Trabalho'),
  ('ti', 'Tecnologia da Informação')
ON CONFLICT (id) DO NOTHING;

-- Inserir funções de exemplo
INSERT INTO funcoes (id, nome, acessos) VALUES
  ('estagiario', 'Estagiário', ARRAY['dashboard']),
  ('auxiliar', 'Auxiliar', ARRAY['dashboard']),
  ('assistente', 'Assistente', ARRAY['dashboard']),
  ('analista_jr', 'Analista Jr', ARRAY['dashboard']),
  ('analista_pl', 'Analista Pl', ARRAY['dashboard', 'compras']),
  ('analista_sr', 'Analista Sr', ARRAY['dashboard', 'compras', 'financeiro']),
  ('tecnico', 'Técnico', ARRAY['dashboard', 'obras', 'ponto']),
  ('supervisor', 'Supervisor', ARRAY['dashboard', 'obras', 'ponto']),
  ('coordenador', 'Coordenador', ARRAY['dashboard', 'obras', 'ponto', 'rh']),
  ('gerente', 'Gerente', ARRAY['dashboard', 'obras', 'ponto', 'rh', 'compras', 'financeiro']),
  ('diretor', 'Diretor', ARRAY['dashboard', 'obras', 'ponto', 'rh', 'compras', 'financeiro', 'cotacoes']),
  ('tecnico_seguranca', 'Técnico de Segurança', ARRAY['dashboard', 'ponto', 'rh'])
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setores_all" ON setores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "funcoes_all" ON funcoes FOR ALL USING (true) WITH CHECK (true);