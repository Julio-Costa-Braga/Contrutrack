-- Fix RLS for perfis
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfis_all" ON perfis;
CREATE POLICY "perfis_all" ON perfis FOR ALL USING (true) WITH CHECK (true);