-- Atualizar requisições existentes para aguarda_aprovacao_financeiro
UPDATE requisicoes
SET estado = 'aguarda_aprovacao_financeiro'
WHERE estado = 'aguarda_cotacao';