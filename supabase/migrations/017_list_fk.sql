-- Desativar constraints temporariamente e excluir utilizador
-- Primeiro, liste todas as tabelas com FK para perfis
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.column_name IN ('criado_por', 'user_id', 'perfil_id', 'registado_por', 'solicitado_por', 'aprovado_por', 'para_perfil_id', 'recebido_por');