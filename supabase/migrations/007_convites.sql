-- Table for user invitations
CREATE TABLE IF NOT EXISTS convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  nome TEXT,
  token TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  usado BOOLEAN DEFAULT false,
  expira_em TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  criado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convites_all" ON convites FOR ALL USING (true) WITH CHECK (true);