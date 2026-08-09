// web/types/database.ts
// Tipos TypeScript que espelham o schema do Supabase

export type PapelUtilizador =
  | 'administrador' | 'gerente_obra' | 'rh_dp'
  | 'financeiro' | 'engenheiro' | 'encarregado'

export type EstadoDocumento = 'valido' | 'a_expirar' | 'expirado' | 'pendente'
export type TipoDocumento =
  | 'cartao_cidadao' | 'titulo_residencia' | 'atestado_medico'
  | 'certificado_manobra' | 'formacao_seguranca' | 'contrato_trabalho' | 'outro'

export type EstadoPonto = 'valido' | 'fora_geofence' | 'sem_selfie' | 'manual'
export type TipoPonto = 'entrada' | 'saida'

export type EstadoRequisicao =
  | 'rascunho' | 'aguarda_cotacao'
  | 'aguarda_aprovacao_direta' | 'aguarda_aprovacao_financeiro'
  | 'aguarda_aprovacao_diretoria' | 'aprovado' | 'rejeitado' | 'entregue' | 'fechado'

export type EstadoObra = 'em_preparacao' | 'ativa' | 'suspensa' | 'concluida'

export interface OnboardingLink {
  id: string
  token: string
  email_candidato: string
  nome_candidato?: string
  funcionario_id?: string
  usado: boolean
  expira_em: string
  documentos_necessarios?: string[]
  criado_por?: string
  created_at?: string
}

// ------- Tabelas -------

export interface Perfil {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  papel?: PapelUtilizador
  setor?: string
  ativo?: boolean
  avatar_url?: string
  acessos?: string[]
  alertas_pref?: string[]
  created_at?: string
  updated_at?: string
}

export interface Obra {
  id: string
  nome: string
  descricao?: string
  morada?: string
  cidade?: string
  rua?: string
  numero?: string
  codigo_postal?: string
  estado: EstadoObra
  latitude?: number
  longitude?: number
  raio_geofence: number
  orcamento_total?: number
  custo_real: number
  hora_entrada: string
  hora_saida: string
  hora_almoco_ini: string
  hora_almoco_fim: string
  data_inicio?: string
  data_fim_prev?: string
  data_fim_real?: string
  criado_por?: string
  created_at: string
  updated_at: string
}

export interface Funcionario {
  id: string
  nome_completo: string
  data_nascimento?: string
  nacionalidade?: string
  nif?: string
  niss?: string
  num_cc?: string
  email?: string
  telefone?: string
  morada?: string
  cargo?: string
  data_admissao?: string
  data_saida?: string
  ativo: boolean
  dossie_path?: string
  foto_url?: string
  user_id?: string
  setor?: string
  categoria_profissional?: string
  nivel?: string
  created_at: string
  updated_at: string
}

export interface DocumentoFuncionario {
  id: string
  funcionario_id: string
  tipo: TipoDocumento
  nome: string
  estado: EstadoDocumento
  data_emissao?: string
  data_validade?: string
  ocr_processado: boolean
  ocr_dados?: Record<string, unknown>
  ficheiro_url?: string
  ficheiro_path?: string
  created_at: string
  updated_at: string
}

export interface RegistoPonto {
  id: string
  funcionario_id: string
  obra_id: string
  tipo: TipoPonto
  estado: EstadoPonto
  data_hora: string
  latitude?: number
  longitude?: number
  precisao_gps?: number
  dentro_geofence?: boolean
  distancia_obra?: number
  selfie_url?: string
  biometria_ok: boolean
  contruck_track: boolean
  registado_por?: string
  observacoes?: string
  created_at: string
}

export interface Requisicao {
  id: string
  obra_id: string
  titulo: string
  descricao?: string
  quantidade?: number
  unidade?: string
  valor_estimado?: number
  valor_aprovado?: number
  estado: EstadoRequisicao
  iva_autoliquidacao: boolean
  fotos?: string[]
  aprovado_por?: string
  aprovado_em?: string
  motivo_rejeicao?: string
  criado_por: string
  created_at: string
  updated_at: string
}

export interface Cotacao {
  id: string
  requisicao_id: string
  fornecedor: string
  preco_unitario?: number
  preco_total?: number
  prazo_entrega?: string
  validade_dias?: number
  pdf_url?: string
  ocr_processado: boolean
  ocr_dados?: Record<string, unknown>
  selecionada: boolean
  observacoes?: string
  created_at: string
}

export interface Alerta {
  id: string
  tipo: string
  titulo: string
  mensagem?: string
  urgente: boolean
  lido: boolean
  funcionario_id?: string
  obra_id?: string
  requisicao_id?: string
  documento_id?: string
  para_perfil_id?: string
  para_papel?: PapelUtilizador
  created_at: string
}

export interface Integracao {
  id: string
  provider: string
  config: Record<string, string>
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface Setor {
  id: string
  nome: string
  created_at?: string
}

export interface Funcao {
  id: string
  nome: string
  acessos?: string[]
  created_at?: string
}

export interface FeriasFuncionario {
  id: string
  funcionario_id: string
  data_inicio: string
  data_fim: string
  dias_uteis: number
  estado: 'agendado' | 'aprovado' | 'cancelado' | 'gozado'
  observacoes?: string
  aprovado_por?: string
  created_at: string
  updated_at: string
}

// ------- Database type para o cliente Supabase -------
export interface Database {
  public: {
    Tables: {
      perfis:                 { Row: Perfil;                Insert: Partial<Perfil>;                Update: Partial<Perfil> }
      obras:                  { Row: Obra;                  Insert: Partial<Obra>;                  Update: Partial<Obra> }
      funcionarios:           { Row: Funcionario;           Insert: Partial<Funcionario>;           Update: Partial<Funcionario> }
      documentos_funcionario: { Row: DocumentoFuncionario;  Insert: Partial<DocumentoFuncionario>;  Update: Partial<DocumentoFuncionario> }
      registos_ponto:         { Row: RegistoPonto;          Insert: Partial<RegistoPonto>;          Update: Partial<RegistoPonto> }
      requisicoes:            { Row: Requisicao;            Insert: Partial<Requisicao>;            Update: Partial<Requisicao> }
      cotacoes:               { Row: Cotacao;               Insert: Partial<Cotacao>;               Update: Partial<Cotacao> }
      alertas:                { Row: Alerta;                Insert: Partial<Alerta>;                Update: Partial<Alerta> }
      integracoes:             { Row: Integracao;            Insert: Partial<Integracao>;            Update: Partial<Integracao> }
      setores:               { Row: Setor;              Insert: Partial<Setor>;              Update: Partial<Setor> }
      funcoes:              { Row: Funcao;             Insert: Partial<Funcao>;             Update: Partial<Funcao> }
      ferias_funcionario:    { Row: FeriasFuncionario;   Insert: Partial<FeriasFuncionario>;   Update: Partial<FeriasFuncionario> }
      onboarding_links:     { Row: OnboardingLink;      Insert: Partial<OnboardingLink>;      Update: Partial<OnboardingLink> }
    }
    Views: {
      v_ponto_diario: {
        Row: {
          id: string
          nome_completo: string
          nif?: string
          obra: string
          data: string
          entrada?: string
          saida?: string
          horas_total?: number
          geofence_ok?: boolean
          biometria_ok?: boolean
        }
      }
    }
    Functions: {
      meu_papel: { Returns: PapelUtilizador }
      calcular_estado_documento: { Args: { data_validade: string }; Returns: EstadoDocumento }
    }
  }
}
