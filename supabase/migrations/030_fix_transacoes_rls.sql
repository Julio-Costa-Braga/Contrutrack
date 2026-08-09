-- Remover RLS restritivo de transacoes (se existir)
ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;

-- Ou criar política permissiva para leitura
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura a todos autenticados" ON transacoes;
CREATE POLICY "Permitir leitura a todos autenticados" ON transacoes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir insercao via service role" ON transacoes;
CREATE POLICY "Permitir insercao via service role" ON transacoes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update/delete aos admins" ON transacoes;
CREATE POLICY "Permitir update/delete aos admins" ON transacoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfis 
      WHERE perfis.id = auth.uid() 
      AND perfis.papel = 'administrador'
    )
  );
