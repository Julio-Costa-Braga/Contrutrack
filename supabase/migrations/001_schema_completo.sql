-- ============================================================
-- ConstruTrack — Schema completo Supabase / PostgreSQL
-- Colar no SQL Editor do Supabase e executar
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE papel_utilizador AS ENUM (
  'administrador',
  'gerente_obra',
  'rh_dp',
  'financeiro',
  'engenheiro',
  'encarregado'
);

CREATE TYPE estado_documento AS ENUM (
  'valido',
  'a_expirar',  -- expira em menos de 30 dias
  'expirado',
  'pendente'
);

CREATE TYPE tipo_documento AS ENUM (
  'cartao_cidadao',
  'titulo_residencia',
  'atestado_medico',
  'certificado_manobra',
  'formacao_seguranca',
  'contrato_trabalho',
  'outro'
);

CREATE TYPE estado_ponto AS ENUM (
  'valido',
  'fora_geofence',
  'sem_selfie',
  'manual'  -- registo pelo encarregado (ponto coletivo)
);

CREATE TYPE tipo_ponto AS ENUM ('entrada', 'saida');

CREATE TYPE estado_requisicao AS ENUM (
  'rascunho',
  'aguarda_cotacao',
  'aguarda_aprovacao_direta',
  'aguarda_aprovacao_financeiro',
  'aguarda_aprovacao_diretoria',
  'aprovado',
  'rejeitado',
  'entregue',
  'fechado'
);

CREATE TYPE nivel_aprovacao AS ENUM (
  'direta',       -- até ao limite configurado
  'financeiro',
  'diretoria'
);

CREATE TYPE estado_obra AS ENUM (
  'em_preparacao',
  'ativa',
  'suspensa',
  'concluida'
);

-- ============================================================
-- PERFIS DE UTILIZADOR (extensão da auth.users do Supabase)
-- ============================================================

CREATE TABLE perfis (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email         TEXT NOT NULL,
  telefone      TEXT,
  papel         papel_utilizador NOT NULL DEFAULT 'engenheiro',
  ativo         BOOLEAN NOT NULL DEFAULT true,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONFIGURAÇÃO DA EMPRESA
-- ============================================================

CREATE TABLE configuracao (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_empresa                TEXT NOT NULL,
  nif_empresa                 TEXT NOT NULL,
  limite_aprovacao_direta     NUMERIC(12,2) NOT NULL DEFAULT 5000,
  limite_aprovacao_financeiro NUMERIC(12,2) NOT NULL DEFAULT 50000,
  subsídio_alimentacao_valor  NUMERIC(8,2)  NOT NULL DEFAULT 6.00,
  horas_trabalho_dia          NUMERIC(4,2)  NOT NULL DEFAULT 8.0,
  fuso_horario                TEXT NOT NULL DEFAULT 'Europe/Lisbon',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configuração default
INSERT INTO configuracao (nome_empresa, nif_empresa)
VALUES ('A Minha Empresa Construção Lda.', '123456789');

-- ============================================================
-- OBRAS / ESTALEIROS
-- ============================================================

CREATE TABLE obras (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  descricao       TEXT,
  morada          TEXT,
  cidade          TEXT,
  estado          estado_obra NOT NULL DEFAULT 'em_preparacao',
  -- Geofence
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  raio_geofence   INTEGER NOT NULL DEFAULT 100, -- metros
  -- Orçamento
  orcamento_total NUMERIC(14,2),
  custo_real      NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Horário padrão
  hora_entrada    TIME NOT NULL DEFAULT '07:30',
  hora_saida      TIME NOT NULL DEFAULT '17:00',
  hora_almoco_ini TIME NOT NULL DEFAULT '13:00',
  hora_almoco_fim TIME NOT NULL DEFAULT '14:00',
  -- Meta
  data_inicio     DATE,
  data_fim_prev   DATE,
  data_fim_real   DATE,
  criado_por      UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Associação gerente ↔ obra (um gerente pode ter várias obras)
CREATE TABLE obra_gerentes (
  obra_id    UUID REFERENCES obras(id) ON DELETE CASCADE,
  perfil_id  UUID REFERENCES perfis(id) ON DELETE CASCADE,
  PRIMARY KEY (obra_id, perfil_id)
);

-- ============================================================
-- FUNCIONÁRIOS
-- ============================================================

CREATE TABLE funcionarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Dados pessoais
  nome_completo   TEXT NOT NULL,
  data_nascimento DATE,
  nacionalidade   TEXT DEFAULT 'Portuguesa',
  -- Documentos legais
  nif             TEXT UNIQUE,
  niss            TEXT UNIQUE,
  num_cc          TEXT,  -- cartão cidadão
  -- Contacto
  email           TEXT,
  telefone        TEXT,
  morada          TEXT,
  -- Contrato
  cargo           TEXT,
  data_admissao   DATE,
  data_saida      DATE,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  -- Dossiê digital (pasta no Supabase Storage)
  dossie_path     TEXT, -- ex: "JOAO_SILVA_123456789/"
  foto_url        TEXT,
  -- Meta
  criado_por      UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Associação funcionário ↔ obra
CREATE TABLE funcionario_obras (
  funcionario_id  UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  obra_id         UUID REFERENCES obras(id) ON DELETE CASCADE,
  data_inicio     DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim        DATE,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (funcionario_id, obra_id)
);

-- ============================================================
-- DOCUMENTOS DOS FUNCIONÁRIOS (RH)
-- ============================================================

CREATE TABLE documentos_funcionario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id  UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo            tipo_documento NOT NULL,
  nome            TEXT NOT NULL,        -- ex: "Atestado Médico de Aptidão"
  estado          estado_documento NOT NULL DEFAULT 'pendente',
  data_emissao    DATE,
  data_validade   DATE,
  -- OCR
  ocr_processado  BOOLEAN NOT NULL DEFAULT false,
  ocr_dados       JSONB,               -- dados extraídos pelo OCR
  -- Storage
  ficheiro_url    TEXT,                -- URL no Supabase Storage
  ficheiro_path   TEXT,
  -- Meta
  criado_por      UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Links de onboarding para candidatos
CREATE TABLE onboarding_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email_candidato TEXT NOT NULL,
  nome_candidato  TEXT,
  funcionario_id  UUID REFERENCES funcionarios(id),  -- preenchido após completar
  usado           BOOLEAN NOT NULL DEFAULT false,
  expira_em       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  criado_por      UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PONTO ELETRÓNICO
-- ============================================================

CREATE TABLE registos_ponto (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id  UUID NOT NULL REFERENCES funcionarios(id),
  obra_id         UUID NOT NULL REFERENCES obras(id),
  tipo            tipo_ponto NOT NULL,
  estado          estado_ponto NOT NULL DEFAULT 'valido',
  -- Temporal
  data_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- GPS
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  precisao_gps    DOUBLE PRECISION,    -- metros
  dentro_geofence BOOLEAN,
  distancia_obra  DOUBLE PRECISION,    -- metros até centro da obra
  -- Biometria
  selfie_url      TEXT,                -- Supabase Storage
  biometria_ok    BOOLEAN DEFAULT false,
  contruck_track  BOOLEAN NOT NULL DEFAULT false,
  -- Ponto coletivo
  registado_por   UUID REFERENCES perfis(id),  -- encarregado (se manual)
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View útil para relatórios ACT
CREATE OR REPLACE VIEW v_ponto_diario AS
SELECT
  rp.id,
  f.nome_completo,
  f.nif,
  o.nome AS obra,
  DATE(rp.data_hora AT TIME ZONE 'Europe/Lisbon') AS data,
  MAX(CASE WHEN rp.tipo = 'entrada' THEN rp.data_hora END) AS entrada,
  MAX(CASE WHEN rp.tipo = 'saida'   THEN rp.data_hora END) AS saida,
  EXTRACT(EPOCH FROM (
    MAX(CASE WHEN rp.tipo = 'saida'   THEN rp.data_hora END) -
    MAX(CASE WHEN rp.tipo = 'entrada' THEN rp.data_hora END)
  )) / 3600 AS horas_total,
  BOOL_AND(rp.dentro_geofence) AS geofence_ok,
  BOOL_AND(rp.biometria_ok)    AS biometria_ok
FROM registos_ponto rp
JOIN funcionarios f ON f.id = rp.funcionario_id
JOIN obras o ON o.id = rp.obra_id
GROUP BY rp.id, f.nome_completo, f.nif, o.nome, DATE(rp.data_hora AT TIME ZONE 'Europe/Lisbon'),
         rp.funcionario_id, rp.obra_id;

-- ============================================================
-- COMPRAS E LOGÍSTICA
-- ============================================================

CREATE TABLE requisicoes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id             UUID NOT NULL REFERENCES obras(id),
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  quantidade          NUMERIC(12,3),
  unidade             TEXT,            -- ex: "ton", "m3", "un"
  valor_estimado      NUMERIC(14,2),
  valor_aprovado      NUMERIC(14,2),
  estado              estado_requisicao NOT NULL DEFAULT 'rascunho',
  nivel_aprovacao     nivel_aprovacao,
  -- IVA Autoliquidação (inversão sujeito passivo — construção civil PT)
  iva_autoliquidacao  BOOLEAN NOT NULL DEFAULT true,
  -- Fotos da obra (requisição feita no campo)
  fotos               TEXT[],          -- array de URLs Storage
  -- Aprovação
  aprovado_por        UUID REFERENCES perfis(id),
  aprovado_em         TIMESTAMPTZ,
  motivo_rejeicao     TEXT,
  -- Meta
  criado_por          UUID NOT NULL REFERENCES perfis(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cotacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisicao_id   UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
  fornecedor      TEXT NOT NULL,
  preco_unitario  NUMERIC(14,4),
  preco_total     NUMERIC(14,2),
  prazo_entrega   TEXT,           -- ex: "5 dias úteis"
  validade_dias   INTEGER,
  -- OCR do PDF do fornecedor
  pdf_url         TEXT,
  ocr_processado  BOOLEAN NOT NULL DEFAULT false,
  ocr_dados       JSONB,
  -- Selecionada?
  selecionada     BOOLEAN NOT NULL DEFAULT false,
  observacoes     TEXT,
  criado_por      UUID REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recepcao_materiais (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisicao_id   UUID NOT NULL REFERENCES requisicoes(id),
  data_recepcao   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantidade_rec  NUMERIC(12,3),
  -- Foto da Guia de Remessa
  guia_remessa_url TEXT,
  guia_remessa_ocr JSONB,
  -- Confronto com fatura
  fatura_url      TEXT,
  fatura_ok       BOOLEAN,
  fatura_obs      TEXT,
  ciclo_fechado   BOOLEAN NOT NULL DEFAULT false,
  recebido_por    UUID NOT NULL REFERENCES perfis(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ALERTAS E NOTIFICAÇÕES
-- ============================================================

CREATE TABLE alertas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo            TEXT NOT NULL,       -- 'doc_expirando', 'aprovacao_pendente', etc.
  titulo          TEXT NOT NULL,
  mensagem        TEXT,
  urgente         BOOLEAN NOT NULL DEFAULT false,
  lido            BOOLEAN NOT NULL DEFAULT false,
  -- Referências (opcional)
  funcionario_id  UUID REFERENCES funcionarios(id),
  obra_id         UUID REFERENCES obras(id),
  requisicao_id   UUID REFERENCES requisicoes(id),
  documento_id    UUID REFERENCES documentos_funcionario(id),
  -- Destinatário
  para_perfil_id  UUID REFERENCES perfis(id),
  para_papel      papel_utilizador,    -- enviar para todos de um papel
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNÇÕES ÚTEIS
-- ============================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Aplica o trigger nas tabelas relevantes
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['perfis','obras','funcionarios','documentos_funcionario','requisicoes']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_updated_at()', t);
  END LOOP;
END $$;

-- Calcula estado de documentos automaticamente
CREATE OR REPLACE FUNCTION calcular_estado_documento(data_validade DATE)
RETURNS estado_documento AS $$
BEGIN
  IF data_validade IS NULL THEN RETURN 'pendente'; END IF;
  IF data_validade < CURRENT_DATE THEN RETURN 'expirado'; END IF;
  IF data_validade < CURRENT_DATE + INTERVAL '30 days' THEN RETURN 'a_expirar'; END IF;
  RETURN 'valido';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: recalcular estado ao inserir/atualizar documento
CREATE OR REPLACE FUNCTION trigger_estado_documento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estado = calcular_estado_documento(NEW.data_validade);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_estado_documento
  BEFORE INSERT OR UPDATE OF data_validade ON documentos_funcionario
  FOR EACH ROW EXECUTE FUNCTION trigger_estado_documento();

-- Trigger: gerar alerta automático quando documento expira em < 30 dias
CREATE OR REPLACE FUNCTION trigger_alerta_documento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('a_expirar', 'expirado') AND
     (OLD.estado IS NULL OR OLD.estado NOT IN ('a_expirar', 'expirado')) THEN
    INSERT INTO alertas (tipo, titulo, mensagem, urgente, funcionario_id, documento_id, para_papel)
    SELECT
      'doc_expirando',
      'Documento a expirar: ' || NEW.nome,
      (SELECT nome_completo FROM funcionarios WHERE id = NEW.funcionario_id) ||
      ' — ' || NEW.nome ||
      CASE WHEN NEW.estado = 'expirado' THEN ' — VENCIDO' ELSE ' — vence em breve' END,
      NEW.estado = 'expirado',
      NEW.funcionario_id,
      NEW.id,
      'rh_dp';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_alerta_documento
  AFTER INSERT OR UPDATE ON documentos_funcionario
  FOR EACH ROW EXECUTE FUNCTION trigger_alerta_documento();

-- Trigger: nivel de aprovação da requisição baseado no valor
CREATE OR REPLACE FUNCTION trigger_nivel_aprovacao()
RETURNS TRIGGER AS $$
DECLARE cfg configuracao%ROWTYPE;
BEGIN
  SELECT * INTO cfg FROM configuracao LIMIT 1;
  IF NEW.valor_estimado <= cfg.limite_aprovacao_direta THEN
    NEW.nivel_aprovacao = 'direta';
    NEW.estado = 'aguarda_aprovacao_direta';
  ELSIF NEW.valor_estimado <= cfg.limite_aprovacao_financeiro THEN
    NEW.nivel_aprovacao = 'financeiro';
    NEW.estado = 'aguarda_aprovacao_financeiro';
  ELSE
    NEW.nivel_aprovacao = 'diretoria';
    NEW.estado = 'aguarda_aprovacao_diretoria';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_nivel_aprovacao
  BEFORE INSERT OR UPDATE OF valor_estimado ON requisicoes
  FOR EACH ROW
  WHEN (NEW.estado NOT IN ('rascunho','aprovado','rejeitado','entregue','fechado'))
  EXECUTE FUNCTION trigger_nivel_aprovacao();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE perfis                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_funcionario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE registos_ponto          ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas                 ENABLE ROW LEVEL SECURITY;

-- Helper: papel do utilizador autenticado
CREATE OR REPLACE FUNCTION meu_papel()
RETURNS papel_utilizador AS $$
  SELECT papel FROM perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PERFIS: cada um vê o seu; admins veem tudo
CREATE POLICY "perfis_proprios" ON perfis
  FOR SELECT USING (id = auth.uid() OR meu_papel() IN ('administrador','rh_dp'));
CREATE POLICY "perfis_update" ON perfis
  FOR UPDATE USING (id = auth.uid() OR meu_papel() = 'administrador');

-- OBRAS: todos os autenticados podem ler; só admin/gerente escrevem
CREATE POLICY "obras_leitura" ON obras
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "obras_escrita" ON obras
  FOR ALL USING (meu_papel() IN ('administrador','gerente_obra'));

-- FUNCIONÁRIOS: RH e admin gerem; outros apenas leem
CREATE POLICY "func_leitura" ON funcionarios
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "func_escrita" ON funcionarios
  FOR ALL USING (meu_papel() IN ('administrador','rh_dp'));

-- DOCUMENTOS: apenas RH/admin
CREATE POLICY "docs_rh" ON documentos_funcionario
  FOR ALL USING (meu_papel() IN ('administrador','rh_dp'));

-- PONTO: todos inserem o próprio; RH/admin/gerente leem tudo
CREATE POLICY "ponto_inserir" ON registos_ponto
  FOR INSERT WITH CHECK (
    funcionario_id IN (SELECT id FROM funcionarios WHERE email = (SELECT email FROM perfis WHERE id = auth.uid()))
    OR meu_papel() IN ('administrador','rh_dp','gerente_obra','encarregado')
  );
CREATE POLICY "ponto_leitura" ON registos_ponto
  FOR SELECT USING (
    meu_papel() IN ('administrador','rh_dp','gerente_obra','financeiro')
    OR funcionario_id IN (SELECT id FROM funcionarios WHERE email = (SELECT email FROM perfis WHERE id = auth.uid()))
  );

-- REQUISIÇÕES: engenheiro insere; financeiro/admin aprovam; todos leem
CREATE POLICY "req_leitura" ON requisicoes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "req_inserir" ON requisicoes
  FOR INSERT WITH CHECK (meu_papel() IN ('administrador','gerente_obra','engenheiro','encarregado'));
CREATE POLICY "req_aprovar" ON requisicoes
  FOR UPDATE USING (meu_papel() IN ('administrador','gerente_obra','financeiro'));

-- ALERTAS: cada um vê os seus
CREATE POLICY "alertas_proprios" ON alertas
  FOR SELECT USING (
    para_perfil_id = auth.uid()
    OR para_papel = meu_papel()
    OR meu_papel() = 'administrador'
  );

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_ponto_funcionario  ON registos_ponto(funcionario_id);
CREATE INDEX idx_ponto_obra         ON registos_ponto(obra_id);
CREATE INDEX idx_ponto_data         ON registos_ponto(data_hora DESC);
CREATE INDEX idx_docs_funcionario   ON documentos_funcionario(funcionario_id);
CREATE INDEX idx_docs_estado        ON documentos_funcionario(estado);
CREATE INDEX idx_docs_validade      ON documentos_funcionario(data_validade);
CREATE INDEX idx_req_obra           ON requisicoes(obra_id);
CREATE INDEX idx_req_estado         ON requisicoes(estado);
CREATE INDEX idx_alertas_papel      ON alertas(para_papel);
CREATE INDEX idx_alertas_perfil     ON alertas(para_perfil_id);

-- ============================================================
-- STORAGE: criar buckets (executar separadamente no dashboard
-- ou via API — SQL não cria buckets diretamente)
-- ============================================================
-- Buckets necessários:
--   selfies          → fotos de ponto (privado)
--   documentos-rh    → docs dos funcionários (privado)
--   fotos-obra       → fotos de requisição/receção (privado)
--   guias-remessa    → GRs e faturas (privado)
-- Criar em: Supabase Dashboard > Storage > New Bucket

-- ============================================================
-- DADOS DE EXEMPLO (opcional — apagar em produção)
-- ============================================================

INSERT INTO obras (nome, cidade, estado, latitude, longitude, raio_geofence, orcamento_total)
VALUES
  ('Loteamento Sintra', 'Sintra', 'ativa', 38.8029, -9.3817, 80, 480000),
  ('Edifício Porto — Boavista', 'Porto', 'ativa', 41.1496, -8.6109, 120, 1200000),
  ('Reabilitação Bairro Alto', 'Lisboa', 'ativa', 38.7139, -9.1394, 60, 220000),
  ('Armazém Braga Norte', 'Braga', 'ativa', 41.5518, -8.4229, 200, 340000);
