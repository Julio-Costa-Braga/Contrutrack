-- web/supabase/migrations/047_onboarding_documentos_necessarios.sql
-- Adiciona coluna para RH escolher quais documentos pedir no onboarding

ALTER TABLE onboarding_links
  ADD COLUMN IF NOT EXISTS documentos_necessarios TEXT[] NOT NULL DEFAULT ARRAY[
    'cartao_cidadao',
    'contrato_trabalho',
    'atestado_medico',
    'formacao_seguranca',
    'certificado_manobra'
  ];
