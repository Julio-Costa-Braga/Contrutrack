-- Adicionar coluna para preferências de alertas na tabela perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS alertas_pref TEXT[] DEFAULT ARRAY['ponto_atraso', 'ponto_saida', 'requisicao_pendente', 'obra_orcamento'];

-- Comentário para documentação
COMMENT ON COLUMN perfis.alertas_pref IS 'Tipos de alertas que o utilizador recebe: ponto_atraso, ponto_saida, requisicao_pendente, obra_orcamento, obra_estado, funcionario_ferias, documento_vencimento';
