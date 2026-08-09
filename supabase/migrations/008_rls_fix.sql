-- Fix RLS for requisicoes
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "requisicoes_all" ON requisicoes;
CREATE POLICY "requisicoes_all" ON requisicoes FOR ALL USING (true) WITH CHECK (true);