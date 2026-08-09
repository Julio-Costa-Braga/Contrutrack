-- Função para eliminar obra e todos os registos dependentes
CREATE OR REPLACE FUNCTION delete_obra(obra_id UUID)
RETURNS void AS $$
BEGIN
  -- Eliminar registos de ponto
  DELETE FROM registos_ponto WHERE obra_id = obra_id;
  
  -- Eliminar associações funcionario_obras
  DELETE FROM funcionario_obras WHERE obra_id = obra_id;
  
  -- Eliminar requisições (compras)
  DELETE FROM requisicoes WHERE obra_id = obra_id;
  
  -- Eliminar transações
  DELETE FROM transacoes WHERE obra_id = obra_id;
  
  -- Eliminar alertas
  DELETE FROM alertas WHERE obra_id = obra_id;
  
  -- Eliminar gerentes da obra
  DELETE FROM obra_gerentes WHERE obra_id = obra_id;
  
  -- Finalmente, eliminar a obra
  DELETE FROM obras WHERE id = obra_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
