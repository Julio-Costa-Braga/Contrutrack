-- Eliminar utilizador e todos os registos relacionados
-- UID: 4a349b5b-20e1-4cc7-a324-94d94c80913b

BEGIN;

DELETE FROM obras WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM obra_gerentes WHERE perfil_id = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM funcionarios WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM documentos_funcionario WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM onboarding_links WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM registos_ponto WHERE registado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM requisicoes WHERE aprovado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM requisicoes WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM cotacoes WHERE criado_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM recepcao_materiais WHERE recebido_por = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM alertas WHERE para_perfil_id = '4a349b5b-20e1-4cc7-a324-94d94c80913b';

DELETE FROM perfis WHERE id = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM convites WHERE user_id = '4a349b5b-20e1-4cc7-a324-94d94c80913b';
DELETE FROM auth.users WHERE id = '4a349b5b-20e1-4cc7-a324-94d94c80913b';

COMMIT;