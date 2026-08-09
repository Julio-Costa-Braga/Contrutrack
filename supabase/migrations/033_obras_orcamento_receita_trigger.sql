-- Criar receita automática quando uma obra é adicionada com orçamento
CREATE OR REPLACE FUNCTION public.obras_orcamento_para_transacao()
RETURNS trigger AS $$
BEGIN
  IF NEW.orcamento_total IS NOT NULL AND NEW.orcamento_total > 0 THEN
    INSERT INTO transacoes (
      descricao,
      valor,
      tipo,
      categoria,
      data,
      obra_id,
      criado_por
    ) VALUES (
      'Orçamento: ' || NEW.nome,
      NEW.orcamento_total,
      'receita',
      'Orçamento',
      CURRENT_DATE,
      NEW.criado_por
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS obras_orcamento_receita ON obras;
CREATE TRIGGER obras_orcamento_receita
AFTER INSERT ON obras
FOR EACH ROW
EXECUTE FUNCTION public.obras_orcamento_para_transacao();
