-- Soft delete / lixeira com 5 dias de retenção
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Função que elimina permanentemente itens com mais de 5 dias na lixeira
CREATE OR REPLACE FUNCTION cleanup_lixeira()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM requisicoes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '5 days';
  DELETE FROM transacoes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '5 days';
  DELETE FROM obras WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '5 days';
  DELETE FROM funcionarios WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '5 days';
  DELETE FROM cotacoes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '5 days';
END;
$$;
