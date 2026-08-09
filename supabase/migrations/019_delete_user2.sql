-- Eliminar utilizador e todos os registos relacionados
-- UID: b8e77150-ffeb-4dd3-9821-294049c097bd

BEGIN;

DELETE FROM obras WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM obra_gerentes WHERE perfil_id = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM funcionarios WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM documentos_funcionario WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM onboarding_links WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM registos_ponto WHERE registado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM requisicoes WHERE aprovado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM requisicoes WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM cotacoes WHERE criado_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM recepcao_materiais WHERE recebido_por = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM alertas WHERE para_perfil_id = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM perfis WHERE id = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM convites WHERE user_id = 'b8e77150-ffeb-4dd3-9821-294049c097bd';
DELETE FROM auth.users WHERE id = 'b8e77150-ffeb-4dd3-9821-294049c097bd';

COMMIT;