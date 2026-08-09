-- Função completa para excluir obra e todos os registos dependentes
CREATE OR REPLACE FUNCTION delete_obra(obra_id UUID)
RETURNS void AS $$
BEGIN
  -- Eliminar registos dependentes (ordem importa para não violar FKs)
  DELETE FROM obra_gerentes WHERE obra_id = $1;
  DELETE FROM documentos WHERE obra_id = $1;
  DELETE FROM requisicoes_aprovacoes WHERE requisicao_id IN (SELECT id FROM requisicoes_compras WHERE obra_id = $1);
  DELETE FROM requisicoes_compras WHERE obra_id = $1;
  DELETE FROM requisicoes WHERE obra_id = $1;
  DELETE FROM diarias WHERE obra_id = $1;
  DELETE FROM ponto WHERE obra_id = $1;
  DELETE FROM transacoes WHERE obra_id = $1;
  DELETE FROM cotacoes WHERE obra_id = $1;
  DELETE FROM recepcao_materiais WHERE obra_id = $1;
  DELETE FROM alertas WHERE obra_id = $1;
  DELETE FROM obras WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;