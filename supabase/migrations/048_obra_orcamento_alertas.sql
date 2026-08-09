-- web/supabase/migrations/048_obra_orcamento_alertas.sql
-- Alertas automáticos de orçamento de obra: 75%, 90%, 100%

CREATE OR REPLACE FUNCTION trigger_alerta_obra_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  percentual NUMERIC;
  alerta_tipo TEXT;
  alerta_titulo TEXT;
  alerta_mensagem TEXT;
  alerta_urgente BOOLEAN;
BEGIN
  -- Só executar se orcamento_total > 0
  IF NEW.orcamento_total IS NULL OR NEW.orcamento_total <= 0 THEN
    RETURN NEW;
  END IF;

  percentual := (NEW.custo_real / NEW.orcamento_total) * 100;

  -- Determinar o nível do alerta
  IF percentual >= 100 THEN
    alerta_tipo := 'obra_orcamento_100';
    alerta_titulo := 'Orçamento máximo atingido: ' || NEW.nome;
    alerta_mensagem := 'A obra "' || NEW.nome || '" atingiu ' || ROUND(percentual, 1) || '% do orçamento (€' || ROUND(NEW.custo_real, 2) || ' de €' || ROUND(NEW.orcamento_total, 2) || ').';
    alerta_urgente := true;
  ELSIF percentual >= 90 THEN
    alerta_tipo := 'obra_orcamento_90';
    alerta_titulo := 'Orçamento crítico: ' || NEW.nome;
    alerta_mensagem := 'A obra "' || NEW.nome || '" está com ' || ROUND(percentual, 1) || '% do orçamento utilizado (€' || ROUND(NEW.custo_real, 2) || ' de €' || ROUND(NEW.orcamento_total, 2) || ').';
    alerta_urgente := false;
  ELSIF percentual >= 75 THEN
    alerta_tipo := 'obra_orcamento_75';
    alerta_titulo := 'Orçamento a meio: ' || NEW.nome;
    alerta_mensagem := 'A obra "' || NEW.nome || '" já consumiu ' || ROUND(percentual, 1) || '% do orçamento (€' || ROUND(NEW.custo_real, 2) || ' de €' || ROUND(NEW.orcamento_total, 2) || ').';
    alerta_urgente := false;
  ELSE
    RETURN NEW;
  END IF;

  -- Evitar duplicados: não criar alerta se já existir um não lido do mesmo tipo para a mesma obra
  IF NOT EXISTS (
    SELECT 1 FROM alertas
    WHERE tipo = alerta_tipo
      AND obra_id = NEW.id
      AND lido = false
  ) THEN
    INSERT INTO alertas (tipo, titulo, mensagem, urgente, obra_id, para_papel)
    VALUES (alerta_tipo, alerta_titulo, alerta_mensagem, alerta_urgente, NEW.id, 'administrador');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_alerta_obra_orcamento ON obras;
CREATE TRIGGER auto_alerta_obra_orcamento
  AFTER UPDATE OF custo_real ON obras
  FOR EACH ROW
  EXECUTE FUNCTION trigger_alerta_obra_orcamento();

-- Política para permitir INSERT via trigger (para o SECURITY DEFINER e uso direto via API)
DROP POLICY IF EXISTS "alertas_inserir" ON alertas;
CREATE POLICY "alertas_inserir" ON alertas
  FOR INSERT WITH CHECK (true);
