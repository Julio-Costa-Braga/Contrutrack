-- ============================================================
-- POLÍTICAS RLS - Limpar todas e recriar
-- ============================================================

-- Desativar temporariamente RLS para limpar
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_funcionario DISABLE ROW LEVEL SECURITY;
ALTER TABLE registos_ponto DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE obra_gerentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas (maneira mais simples - recriar tabelas seria melhor mas não vamos fazer isso)
-- Em vez disso, vamos apenas recriar as políticas ignorando erros

DO $$ 
DECLARE
    tbl TEXT;
    pol TEXT;
BEGIN
    -- Perfis
    DROP POLICY IF EXISTS "perfis_proprios" ON perfis;
    DROP POLICY IF EXISTS "perfis_update" ON perfis;
    DROP POLICY IF EXISTS "perfis_insert" ON perfis;
    DROP POLICY IF EXISTS "perfis_leitura" ON perfis;
    
    -- Obras
    DROP POLICY IF EXISTS "obras_leitura" ON obras;
    DROP POLICY IF EXISTS "obras_escrita" ON obras;
    
    -- Funcionarios
    DROP POLICY IF EXISTS "func_leitura" ON funcionarios;
    DROP POLICY IF EXISTS "func_escrita" ON funcionarios;
    
    -- Documentos
    DROP POLICY IF EXISTS "docs_rh" ON documentos_funcionario;
    DROP POLICY IF EXISTS "docs_leitura" ON documentos_funcionario;
    DROP POLICY IF EXISTS "docs_escrita" ON documentos_funcionario;
    
    -- Ponto
    DROP POLICY IF EXISTS "ponto_inserir" ON registos_ponto;
    DROP POLICY IF EXISTS "ponto_leitura" ON registos_ponto;
    DROP POLICY IF EXISTS "ponto_update" ON registos_ponto;
    
    -- Requisicoes
    DROP POLICY IF EXISTS "req_leitura" ON requisicoes;
    DROP POLICY IF EXISTS "req_inserir" ON requisicoes;
    DROP POLICY IF EXISTS "req_aprovar" ON requisicoes;
    DROP POLICY IF EXISTS "req_update" ON requisicoes;
    
    -- Alertas
    DROP POLICY IF EXISTS "alertas_proprios" ON alertas;
    DROP POLICY IF EXISTS "alertas_leitura" ON alertas;
    DROP POLICY IF EXISTS "alertas_escrita" ON alertas;
    
    -- Configuracao
    DROP POLICY IF EXISTS "config_leitura" ON configuracao;
    DROP POLICY IF EXISTS "config_update" ON configuracao;
END $$;

-- Criar políticas novas
CREATE POLICY "perfis_all" ON perfis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "obras_all" ON obras FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "funcionarios_all" ON funcionarios FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "documentos_funcionario_all" ON documentos_funcionario FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "registos_ponto_all" ON registos_ponto FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "requisicoes_all" ON requisicoes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "alertas_all" ON alertas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "obra_gerentes_all" ON obra_gerentes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "config_all" ON configuracao FOR ALL USING (true);

-- Verificar
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;