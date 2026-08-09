-- Backfill de transações de orçamento para obras já existentes
INSERT INTO transacoes (descricao, valor, tipo, categoria, data, obra_id, criado_por)
SELECT
  'Orçamento: ' || o.nome,
  o.orcamento_total,
  'receita',
  'Orçamento',
  CURRENT_DATE,
  o.id,
  o.criado_por
FROM obras o
WHERE o.orcamento_total IS NOT NULL
  AND o.orcamento_total > 0
  AND NOT EXISTS (
    SELECT 1
    FROM transacoes t
    WHERE t.obra_id = o.id
      AND t.tipo = 'receita'
      AND t.categoria = 'Orçamento'
  );

-- Tentar vincular funcionários existentes ao auth.users pelo email
UPDATE funcionarios f
SET user_id = u.id
FROM auth.users u
WHERE f.user_id IS NULL
  AND f.email IS NOT NULL
  AND lower(f.email) = lower(u.email)
  AND NOT EXISTS (
    SELECT 1
    FROM funcionarios f2
    WHERE f2.user_id = u.id
  );
