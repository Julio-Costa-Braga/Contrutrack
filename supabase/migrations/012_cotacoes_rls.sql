-- Fix RLS for cotacoes
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cotacoes_all" ON cotacoes;
CREATE POLICY "cotacoes_all" ON cotacoes FOR ALL USING (true) WITH CHECK (true);