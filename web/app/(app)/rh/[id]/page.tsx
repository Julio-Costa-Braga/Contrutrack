'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Trash2, Edit2, Download, FileText, Clock, Camera, Save, Plus, X, Check, Calendar, ChevronDown, ExternalLink, Copy, Link2, LogIn, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DossierPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [funcionario, setFuncionario] = useState<any>(null)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [pontos, setPontos] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pontos'|'docs'>('pontos')
  const [showAddObraModal, setShowAddObraModal] = useState(false)
  const [selectedObraId, setSelectedObraId] = useState('')
  const [allObras, setAllObras] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [atestadoUploadLoading, setAtestadoUploadLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    nome_completo: '',
    telefone: '',
    morada: '',
    nacionalidade: '',
    nif: '',
    niss: '',
    num_cc: '',
    data_nascimento: '',
    data_admissao: '',
    data_saida: '',
    cargo: '',
    salario_base: '',
    setor: '',
  })
  
  // Carreira editable
  const [editCarreira, setEditCarreira] = useState(false)
  const [carreiraForm, setCarreiraForm] = useState({ setor: '', cargo: '', categoria_profissional: '', nivel: '' })
  
  // Atestado state
  const [atestadoValidade, setAtestadoValidade] = useState('')
  const [atestadoNome, setAtestadoNome] = useState('')
  const [atestadoCID, setAtestadoCID] = useState('')
  
  // Ferias
  const [ferias, setFerias] = useState<any[]>([])
  const [showAddFerias, setShowAddFerias] = useState(false)
  const [feriasForm, setFeriasForm] = useState({ data_inicio: '', data_fim: '', observacoes: '' })

  // Links
  const [onboardingLink, setOnboardingLink] = useState<any>(null)
  const [conviteLink, setConviteLink] = useState<any>(null)

  // Upload manual de documentos
  const [manualDocTipo, setManualDocTipo] = useState('')
  const [manualDocNome, setManualDocNome] = useState('')
  const [manualDocFile, setManualDocFile] = useState<File | null>(null)
  const [manualDocUploading, setManualDocUploading] = useState(false)

  const MANUAL_DOC_OPCOES = [
    { id: 'cartao_cidadao',     nome: 'Cartão de Cidadão / Título de Residência' },
    { id: 'contrato_trabalho',  nome: 'NIF (documento fiscal)' },
    { id: 'atestado_medico',    nome: 'Atestado Médico de Aptidão' },
    { id: 'formacao_seguranca', nome: 'Certificado de Segurança' },
    { id: 'certificado_manobra',nome: 'Certificado de Manobra de Máquinas' },
    { id: 'outro',              nome: 'Outro documento' },
  ]

  // Foto upload
  const [fotoUploading, setFotoUploading] = useState(false)

  useEffect(() => { loadData() }, [id])

  useEffect(() => {
    if (funcionario) {
      setEditForm({
        nome_completo: funcionario.nome_completo || '',
        telefone: funcionario.telefone || '',
        morada: funcionario.morada || '',
        nacionalidade: funcionario.nacionalidade || '',
        nif: funcionario.nif || '',
        niss: funcionario.niss || '',
        num_cc: funcionario.num_cc || '',
        data_nascimento: funcionario.data_nascimento || '',
        data_admissao: funcionario.data_admissao || '',
        data_saida: funcionario.data_saida || '',
        cargo: funcionario.cargo || '',
        salario_base: funcionario.salario_base ? String(funcionario.salario_base) : '',
        setor: funcionario.setor || '',
      })
      setCarreiraForm({
        setor: funcionario.setor || '',
        cargo: funcionario.cargo || '',
        categoria_profissional: funcionario.categoria_profissional || '',
        nivel: funcionario.nivel || '',
      })
    }
  }, [funcionario])

  async function loadData() {
    setLoading(true)
    try {
      const { data: f } = await supabase.from('funcionarios').select('*').eq('id', id).single()
      if (f) {
        setFuncionario(f)
        const [docsResult, pontosResult, obrasResult, allObrasResult, feriasResult, onboardingResult, conviteResult] = await Promise.all([
          supabase.from('documentos_funcionario').select('*').eq('funcionario_id', id).order('created_at', { ascending: false }),
          supabase.from('registos_ponto').select(`*, obras(nome)`).eq('funcionario_id', id).order('data_hora', { ascending: false }).limit(100),
          supabase.from('funcionario_obras').select(`*, obras(id, nome, estado, cidade, distrito)`).eq('funcionario_id', id).eq('ativo', true),
          supabase.from('obras').select('id, nome, estado').in('estado', ['ativa', 'em_preparacao']),
          supabase.from('ferias_funcionario').select('*').eq('funcionario_id', id).order('data_inicio', { ascending: false }),
          supabase.from('onboarding_links').select('*').or(`funcionario_id.eq.${id},email_candidato.eq.${f.email ? `"${f.email}"` : 'none'}`).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          f.email ? supabase.from('convites').select('*').eq('email', f.email).order('created_at', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        ])
        setDocumentos(docsResult.data || [])
        setPontos(pontosResult.data || [])
        setObras(obrasResult.data?.map((fo: any) => fo.obras).filter(Boolean) || [])
        setAllObras(allObrasResult.data || [])
        if (!feriasResult.error) setFerias(feriasResult.data || [])
        setOnboardingLink(onboardingResult.data || null)
        setConviteLink(conviteResult.data || null)
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  if (loading) return <div className="p-8">A carregar...</div>
  if (!funcionario) return <div className="p-8">Funcionário não encontrado</div>

  async function handleDeletePonto(pontoId: string) {
    if (!confirm('Eliminar este registo de ponto?')) return
    const { error } = await supabase.from('registos_ponto').delete().eq('id', pontoId)
    if (error) toast.error(error.message)
    else { toast.success('Registo eliminado'); loadData() }
  }

  async function handleRemoveObra(obraId: string) {
    if (!confirm('Remover esta obra do colaborador?')) return
    const { error } = await supabase.from('funcionario_obras').delete().eq('funcionario_id', id).eq('obra_id', obraId)
    if (error) toast.error(error.message)
    else { toast.success('Obra removida'); loadData() }
  }

  async function handleAddObra() {
    if (!selectedObraId) { toast.error('Selecione uma obra'); return }
    const { error } = await supabase.from('funcionario_obras').insert({ funcionario_id: id, obra_id: selectedObraId, ativo: true })
    if (error) toast.error(error.message)
    else { toast.success('Obra adicionada!'); setShowAddObraModal(false); setSelectedObraId(''); loadData() }
  }

  async function handleUploadAtestado(file: File) {
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Apenas ficheiros PDF são permitidos')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ficheiro muito grande (máximo 5MB)')
      return
    }
    setAtestadoUploadLoading(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `atestados/${id}/${Date.now()}_${safeName}`
    const { error: uploadError } = await supabase.storage.from('documentos').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (uploadError) {
      setAtestadoUploadLoading(false)
      toast.error('Upload: ' + uploadError.message + ' (status: ' + (uploadError as any)?.statusCode + ')')
      console.error('Upload error:', uploadError)
      return
    }
    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
    const nome = atestadoNome.trim() || 'Atestado Médico'
    const ocrDados: any = {}
    if (atestadoCID.trim()) ocrDados.cid = atestadoCID.trim()
    const { error } = await supabase.from('documentos_funcionario').insert({
      funcionario_id: id,
      tipo: 'atestado_medico',
      nome: nome,
      data_validade: atestadoValidade || null,
      ficheiro_url: urlData.publicUrl,
      ficheiro_path: path,
      ocr_dados: Object.keys(ocrDados).length > 0 ? ocrDados : null,
    })
    setAtestadoUploadLoading(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Atestado guardado!')
      setAtestadoNome('')
      setAtestadoCID('')
      setAtestadoValidade('')
      loadData()
    }
  }

  async function handleSaveCarreira() {
    const { error } = await supabase.from('funcionarios').update({
      setor: carreiraForm.setor || null,
      cargo: carreiraForm.cargo || null,
      categoria_profissional: carreiraForm.categoria_profissional || null,
      nivel: carreiraForm.nivel || null,
    }).eq('id', id)
    if (error) { toast.error(error.message) }
    else { toast.success('Plano de carreira atualizado!'); setEditCarreira(false); loadData() }
  }

  async function handleSaveInfo() {
    const payload: any = {
      nome_completo: editForm.nome_completo,
      telefone: editForm.telefone || null,
      morada: editForm.morada || null,
      nacionalidade: editForm.nacionalidade || null,
      nif: editForm.nif || null,
      niss: editForm.niss || null,
      num_cc: editForm.num_cc || null,
      data_nascimento: editForm.data_nascimento || null,
      data_admissao: editForm.data_admissao || null,
      data_saida: editForm.data_saida || null,
      cargo: editForm.cargo || null,
      salario_base: editForm.salario_base ? parseFloat(editForm.salario_base) : null,
      setor: editForm.setor || null,
    }
    const { error } = await supabase.from('funcionarios').update(payload).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Informações atualizadas!'); setShowEditModal(false); loadData() }
  }

  async function handleAddFerias() {
    if (!feriasForm.data_inicio || !feriasForm.data_fim) { toast.error('Preencha data de início e fim'); return }
    const inicio = new Date(feriasForm.data_inicio)
    const fim = new Date(feriasForm.data_fim)
    if (fim < inicio) { toast.error('Data fim deve ser após data início'); return }
    let dias = 0; let d = new Date(inicio)
    while (d <= fim) { if (d.getDay() !== 0 && d.getDay() !== 6) dias++; d.setDate(d.getDate() + 1) }
    const { error } = await supabase.from('ferias_funcionario').insert({
      funcionario_id: id, data_inicio: feriasForm.data_inicio, data_fim: feriasForm.data_fim,
      dias_uteis: dias, observacoes: feriasForm.observacoes || null, estado: 'agendado'
    })
    if (error) toast.error(error.message)
    else { toast.success('Férias agendadas!'); setShowAddFerias(false); setFeriasForm({ data_inicio: '', data_fim: '', observacoes: '' }); loadData() }
  }

  async function handleUpdateFeriasEstado(feriasId: string, estado: string) {
    const { error } = await supabase.from('ferias_funcionario').update({ estado }).eq('id', feriasId)
    if (error) toast.error(error.message)
    else { toast.success('Estado atualizado!'); loadData() }
  }

  async function handleDeleteFerias(feriasId: string) {
    if (!confirm('Eliminar este período de férias?')) return
    const { error } = await supabase.from('ferias_funcionario').delete().eq('id', feriasId)
    if (error) toast.error(error.message)
    else { toast.success('Férias eliminadas!'); loadData() }
  }

  async function handleUploadFoto(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens são permitidas'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máximo 2MB)'); return }
    setFotoUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `fotos/${id}/${Date.now()}_${safeName}`
    const { error: uploadError } = await supabase.storage.from('documentos').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      setFotoUploading(false)
      toast.error('Upload: ' + uploadError.message + ' (status: ' + (uploadError as any)?.statusCode + ')')
      console.error('Upload error:', uploadError)
      return
    }
    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
    const { error } = await supabase.from('funcionarios').update({ foto_url: urlData.publicUrl }).eq('id', id)
    if (!error && funcionario?.user_id) {
      await supabase.from('perfis').update({ avatar_url: urlData.publicUrl }).eq('id', funcionario.user_id)
    }
    setFotoUploading(false)
    if (error) toast.error(error.message)
    else { toast.success('Foto atualizada!'); setShowEditModal(false); loadData() }
  }

  const estadoFeriasColor: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-700',
    aprovado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
    gozado: 'bg-gray-100 text-gray-700',
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-700'
      case 'saida': return 'bg-red-100 text-red-700'
      case 'entrada_almoco': return 'bg-yellow-100 text-yellow-700'
      case 'retorno_almoco': return 'bg-blue-100 text-blue-700'
      case 'atestado': return 'bg-purple-100 text-purple-700'
      case 'folga': return 'bg-pink-100 text-pink-700'
      case 'ferias': return 'bg-cyan-100 text-cyan-700'
      case 'faltas': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  async function handleManualUpload() {
    if (!manualDocTipo || !manualDocFile) { toast.error('Selecione o tipo e o ficheiro'); return }
    if (manualDocTipo === 'outro' && !manualDocNome) { toast.error('Insira o nome do documento'); return }
    setManualDocUploading(true)
    const nomeSeguro = manualDocFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${id}/manual/${Date.now()}_${nomeSeguro}`
    const { error: upErr } = await supabase.storage.from('documentos-rh').upload(path, manualDocFile)
    if (upErr) { toast.error('Upload: ' + upErr.message); setManualDocUploading(false); return }
    const { data: urlData } = supabase.storage.from('documentos-rh').getPublicUrl(path)
    const docNome = manualDocTipo === 'outro' && manualDocNome
      ? manualDocNome
      : MANUAL_DOC_OPCOES.find(o => o.id === manualDocTipo)?.nome || manualDocTipo
    const { error } = await supabase.from('documentos_funcionario').insert({
      funcionario_id: id,
      tipo: manualDocTipo as any,
      nome: docNome,
      ficheiro_url: urlData.publicUrl,
      ficheiro_path: path,
    })
    setManualDocUploading(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Documento adicionado!')
      setManualDocTipo('')
      setManualDocNome('')
      setManualDocFile(null)
      loadData()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <a href="/rh" className="text-blue-600 hover:underline">← Voltar</a>
          <h1 className="text-2xl font-bold">Dossiê: {funcionario.nome_completo}</h1>
        </div>
        <button onClick={() => setShowEditModal(true)} className="btn btn-primary">Editar Informações</button>
      </div>

      {/* Links de Acesso */}
      {(onboardingLink || conviteLink) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-400">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" /> Links de Acesso
          </h2>
          <div className="space-y-3">
            {onboardingLink && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Link de Envio de Documentos</p>
                    <p className="text-xs text-gray-500 truncate">
                      {process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding/{onboardingLink.token}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {onboardingLink.usado ? (
                        <span className="text-xs text-green-600 font-medium">✓ Completo</span>
                      ) : new Date(onboardingLink.expira_em) > new Date() ? (
                        <span className="text-xs text-amber-600">Expira em {format(new Date(onboardingLink.expira_em), 'dd/MM/yyyy')}</span>
                      ) : (
                        <span className="text-xs text-red-600">✗ Expirado</span>
                      )}
                    </div>
                  </div>
                </div>
                {!onboardingLink.usado && new Date(onboardingLink.expira_em) > new Date() && (
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding/${onboardingLink.token}`)
                    toast.success('Link copiado!')
                  }} className="btn btn-sm text-blue-600 flex-shrink-0">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                )}
              </div>
            )}
            {conviteLink && (
              <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <LogIn className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Link de Primeiro Login</p>
                    <p className="text-xs text-gray-500 truncate">
                      {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite?token={conviteLink.token}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {conviteLink.usado ? (
                        <span className="text-xs text-green-600 font-medium">✓ Ativado</span>
                      ) : new Date(conviteLink.expira_em) > new Date() ? (
                        <span className="text-xs text-amber-600">Expira em {format(new Date(conviteLink.expira_em), 'dd/MM/yyyy')}</span>
                      ) : (
                        <span className="text-xs text-red-600">✗ Expirado</span>
                      )}
                    </div>
                  </div>
                </div>
                {!conviteLink.usado && new Date(conviteLink.expira_em) > new Date() && (
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite?token=${conviteLink.token}`)
                    toast.success('Link copiado!')
                  }} className="btn btn-sm text-purple-600 flex-shrink-0">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações Pessoais + Foto */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            {funcionario.foto_url ? (
              <img src={funcionario.foto_url} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-gray-200">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nome Completo:</span>
              <p className="font-medium">{funcionario.nome_completo}</p>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium">{funcionario.email || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Telefone:</span>
              <p className="font-medium">{funcionario.telefone || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">NIF:</span>
              <p className="font-medium">{funcionario.nif || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">NISS:</span>
              <p className="font-medium">{funcionario.niss || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Nº CC:</span>
              <p className="font-medium">{funcionario.num_cc || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Nacionalidade:</span>
              <p className="font-medium">{funcionario.nacionalidade || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Nascimento:</span>
              <p className="font-medium">{funcionario.data_nascimento ? format(new Date(funcionario.data_nascimento), 'dd/MM/yyyy') : '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Morada:</span>
              <p className="font-medium">{funcionario.morada || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Admissão:</span>
              <p className="font-medium">{funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy') : '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Saída:</span>
              <p className="font-medium">{funcionario.data_saida ? format(new Date(funcionario.data_saida), 'dd/MM/yyyy') : '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Ativo:</span>
              <p className={`font-medium ${funcionario.ativo ? 'text-green-600' : 'text-red-600'}`}>{funcionario.ativo ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plano de Carreira */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Plano de Carreira</h2>
          <button onClick={() => setEditCarreira(!editCarreira)} className="btn btn-sm">
            {editCarreira ? <><X className="w-3.5 h-3.5" /> Cancelar</> : <><Edit2 className="w-3.5 h-3.5" /> Editar</>}
          </button>
        </div>
        {editCarreira ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Setor</label>
                <input className="input" value={carreiraForm.setor} onChange={e => setCarreiraForm({...carreiraForm, setor: e.target.value})} placeholder="Ex: Construção Civil" />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input className="input" value={carreiraForm.cargo} onChange={e => setCarreiraForm({...carreiraForm, cargo: e.target.value})} placeholder="Ex: Encarregado" />
              </div>
              <div>
                <label className="label">Categoria Profissional</label>
                <input className="input" value={carreiraForm.categoria_profissional} onChange={e => setCarreiraForm({...carreiraForm, categoria_profissional: e.target.value})} placeholder="Ex: Servente, Cantoneiro..." />
              </div>
              <div>
                <label className="label">Nível</label>
                <select className="input" value={carreiraForm.nivel} onChange={e => setCarreiraForm({...carreiraForm, nivel: e.target.value})}>
                  <option value="">Selecionar nível...</option>
                  <option value="Junior">Júnior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Senior">Sénior</option>
                  <option value="Master">Master</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditCarreira(false)} className="btn flex-1">Cancelar</button>
              <button onClick={handleSaveCarreira} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Guardar</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Setor:</span><p className="font-medium">{funcionario.setor || '—'}</p></div>
            <div><span className="text-gray-500">Cargo:</span><p className="font-medium">{funcionario.cargo || '—'}</p></div>
            <div><span className="text-gray-500">Categoria Profissional:</span><p className="font-medium">{funcionario.categoria_profissional || '—'}</p></div>
            <div><span className="text-gray-500">Nível:</span><p className="font-medium">{funcionario.nivel || '—'}</p></div>
          </div>
        )}
      </div>

      {/* Atestado Médico */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Atestado Médico</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome / Descrição</label>
            <input type="text" className="input" value={atestadoNome} onChange={e => setAtestadoNome(e.target.value)} placeholder="Ex: Atestado de Rotina, Junho 2026" />
          </div>
          <div>
            <label className="label">CID (opcional)</label>
            <input type="text" className="input" value={atestadoCID} onChange={e => setAtestadoCID(e.target.value)} placeholder="Ex: J00, M54.5..." />
          </div>
          <div>
            <label className="label">Data de Validade</label>
            <input type="date" className="input" value={atestadoValidade || ''} onChange={e => setAtestadoValidade(e.target.value)} />
          </div>
          <div>
            <label className="label">Upload (PDF)</label>
            <input type="file" accept=".pdf" className="input" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; await handleUploadAtestado(file); e.target.value = '' }} />
            {atestadoUploadLoading && <p className="text-xs text-gray-500 mt-2">A enviar atestado...</p>}
          </div>
        </div>

        {/* Lista de atestados */}
        {documentos.filter(d => d.tipo === 'atestado_medico').length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-600">Atestados registados:</p>
            {documentos.filter(d => d.tipo === 'atestado_medico').map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{doc.nome}</p>
                    <p className="text-xs text-gray-500">
                      {doc.data_validade && <>Validade: {format(new Date(doc.data_validade), 'dd/MM/yyyy')}</>}
                      {doc.ocr_dados?.cid && <> · CID: {doc.ocr_dados.cid}</>}
                      {doc.created_at && <> · {format(new Date(doc.created_at), 'dd/MM/yyyy')}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.ficheiro_url && (
                    <a href={doc.ficheiro_url} target="_blank" className="text-blue-600 hover:underline text-xs">Ver PDF</a>
                  )}
                  <button onClick={async () => {
                    if (!confirm('Eliminar este atestado?')) return
                    const { error } = await supabase.from('documentos_funcionario').delete().eq('id', doc.id)
                    if (error) toast.error(error.message)
                    else { toast.success('Atestado eliminado'); loadData() }
                  }} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Férias */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5" /> Férias</h2>
          <button onClick={() => setShowAddFerias(true)} className="btn btn-sm"><Plus className="w-3.5 h-3.5" /> Agendar Férias</button>
        </div>
        {ferias.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum período de férias agendado.</p>
        ) : (
          <div className="space-y-3">
            {ferias.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium">{format(new Date(f.data_inicio), 'dd/MM/yyyy')}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="font-medium">{format(new Date(f.data_fim), 'dd/MM/yyyy')}</span>
                    <span className="text-gray-400 ml-2">({f.dias_uteis} dias úteis)</span>
                  </div>
                  <span className={`pill text-xs ${estadoFeriasColor[f.estado] || 'bg-gray-100 text-gray-700'}`}>{f.estado}</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.estado === 'agendado' && (
                    <>
                      <button onClick={() => handleUpdateFeriasEstado(f.id, 'aprovado')} className="text-green-600 hover:text-green-800 p-1" title="Aprovar"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleUpdateFeriasEstado(f.id, 'cancelado')} className="text-red-600 hover:text-red-800 p-1" title="Cancelar"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  {f.estado === 'aprovado' && (
                    <button onClick={() => handleUpdateFeriasEstado(f.id, 'gozado')} className="text-blue-600 hover:text-blue-800 p-1 text-xs" title="Marcar como gozado">✓ Gozado</button>
                  )}
                  <button onClick={() => handleDeleteFerias(f.id)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Obras que Trabalha */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Obras que Trabalha</h2>
          <button onClick={() => setShowAddObraModal(true)} className="btn btn-sm">+ Adicionar Obra</button>
        </div>
        {obras.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma obra ativa associada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {obras.map((obra: any) => (
              <div key={obra.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{obra.nome}</h3>
                  <button onClick={() => handleRemoveObra(obra.id)} className="text-red-500 hover:text-red-700" title="Remover obra"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Estado: <span className={`font-medium ${obra.estado === 'ativa' ? 'text-green-600' : 'text-gray-600'}`}>{obra.estado}</span></p>
                  {obra.cidade && <p>Cidade: {obra.cidade}</p>}
                  {obra.distrito && <p>Distrito: {obra.distrito}</p>}
                </div>
                <a href={`/obras/${obra.id}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">Ver obra →</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Manual de Documentos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-400">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-green-600" /> Upload Manual de Documentos
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Anexar documentos manualmente ao dossiê do funcionário (útil quando o link de onboarding expirou).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="label">Tipo de documento</label>
            <select className="input" value={manualDocTipo} onChange={e => setManualDocTipo(e.target.value)}>
              <option value="">Selecionar...</option>
              {MANUAL_DOC_OPCOES.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          {manualDocTipo === 'outro' && (
            <div className="flex-1 min-w-[160px]">
              <label className="label">Nome do documento</label>
              <input className="input" value={manualDocNome} onChange={e => setManualDocNome(e.target.value)}
                placeholder="Ex: Certificado de Formação" />
            </div>
          )}
          <div className="flex-1 min-w-[160px]">
            <label className="label">Ficheiro</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input"
              onChange={e => setManualDocFile(e.target.files?.[0] || null)} />
          </div>
          <button onClick={handleManualUpload} disabled={manualDocUploading || !manualDocTipo || (manualDocTipo === 'outro' && !manualDocNome) || !manualDocFile}
            className="btn btn-primary">
            {manualDocUploading ? 'A enviar...' : <><Upload className="w-4 h-4" /> Anexar</>}
          </button>
        </div>
      </div>

      {/* Tabs: Ponto e Documentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('pontos')} className={`px-6 py-3 text-sm font-medium ${activeTab === 'pontos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <Clock className="w-4 h-4 inline mr-1" /> Registos de Ponto
          </button>
          <button onClick={() => setActiveTab('docs')} className={`px-6 py-3 text-sm font-medium ${activeTab === 'docs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <FileText className="w-4 h-4 inline mr-1" /> Documentos
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'pontos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Histórico de Ponto</h3>
                <button onClick={() => router.push(`/rh/${id}/ponto`)} className="text-sm text-blue-600 hover:underline">Ver detalhes →</button>
              </div>
              {pontos.length === 0 ? (
                <p className="text-gray-500">Nenhum registo de ponto.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">Data/Hora</th>
                        <th className="py-2">Tipo</th>
                        <th className="py-2">Obra</th>
                        <th className="py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pontos.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{format(new Date(p.data_hora), "dd/MM/yyyy HH:mm", { locale: pt })}</td>
                          <td className="py-2"><span className={`pill ${getTipoColor(p.tipo)}`}>{p.tipo}</span></td>
                          <td className="py-2">{p.obras?.nome || '—'}</td>
                          <td className="py-2"><button onClick={() => handleDeletePonto(p.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'docs' && (
            <div>
              <h3 className="font-semibold mb-4">Documentos</h3>
              {documentos.length === 0 ? (
                <p className="text-gray-500">Nenhum documento registado.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="py-2">Tipo</th><th className="py-2">Nome</th><th className="py-2">Data</th><th className="py-2">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => (
                      <tr key={doc.id} className="border-b">
                        <td className="py-2">{doc.tipo || 'Documento'}</td>
                        <td className="py-2">{doc.nome || 'Documento'}</td>
                        <td className="py-2 text-sm text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-PT') : '—'}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {doc.ficheiro_url ? (
                              <a href={doc.ficheiro_url} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Ver</a>
                            ) : (<span className="text-gray-400 text-sm">Sem ficheiro</span>)}
                            <button onClick={async () => {
                              if (!confirm('Eliminar este documento?')) return
                              const { error } = await supabase.from('documentos_funcionario').delete().eq('id', doc.id)
                              if (error) toast.error(error.message)
                              else { toast.success('Documento eliminado'); loadData() }
                            }} className="text-red-400 hover:text-red-600 p-1" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Informações */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar Informações</h2>
            <div className="space-y-4">
              {/* Foto */}
              <div className="border-b pb-4 mb-4">
                <h3 className="font-medium mb-3">Foto do Funcionário</h3>
                <div className="flex items-center gap-4">
                  {funcionario.foto_url ? (
                    <img src={funcionario.foto_url} alt="Foto" className="w-20 h-20 rounded-full object-cover border" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border"><Camera className="w-6 h-6" /></div>
                  )}
                  <div>
                    <label className="label">Upload Foto</label>
                    <input type="file" accept="image/*" className="input" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; await handleUploadFoto(file) }} />
                    {fotoUploading && <p className="text-xs text-gray-500 mt-1">A enviar foto...</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Nome completo</label><input className="input" value={editForm.nome_completo} onChange={e => setEditForm({ ...editForm, nome_completo: e.target.value })} /></div>
                <div><label className="label">Telefone</label><input className="input" value={editForm.telefone} onChange={e => setEditForm({ ...editForm, telefone: e.target.value })} /></div>
                <div><label className="label">Nacionalidade</label><input className="input" value={editForm.nacionalidade} onChange={e => setEditForm({ ...editForm, nacionalidade: e.target.value })} /></div>
                <div><label className="label">Morada</label><input className="input" value={editForm.morada} onChange={e => setEditForm({ ...editForm, morada: e.target.value })} /></div>
                <div><label className="label">NIF</label><input className="input" value={editForm.nif} onChange={e => setEditForm({ ...editForm, nif: e.target.value })} /></div>
                <div><label className="label">NISS</label><input className="input" value={editForm.niss} onChange={e => setEditForm({ ...editForm, niss: e.target.value })} /></div>
                <div><label className="label">Número CC</label><input className="input" value={editForm.num_cc} onChange={e => setEditForm({ ...editForm, num_cc: e.target.value })} /></div>
                <div><label className="label">Setor</label><input className="input" value={editForm.setor} onChange={e => setEditForm({ ...editForm, setor: e.target.value })} placeholder="Ex: Construção Civil" /></div>
                <div><label className="label">Salário Base (€)</label><input type="number" className="input" value={editForm.salario_base} onChange={e => setEditForm({ ...editForm, salario_base: e.target.value })} /></div>
                <div><label className="label">Data de Nascimento</label><input type="date" className="input" value={editForm.data_nascimento} onChange={e => setEditForm({ ...editForm, data_nascimento: e.target.value })} /></div>
                <div><label className="label">Data de Admissão</label><input type="date" className="input" value={editForm.data_admissao} onChange={e => setEditForm({ ...editForm, data_admissao: e.target.value })} /></div>
                <div><label className="label">Data de Saída</label><input type="date" className="input" value={editForm.data_saida} onChange={e => setEditForm({ ...editForm, data_saida: e.target.value })} /></div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn flex-1">Cancelar</button>
                <button type="button" onClick={handleSaveInfo} className="btn btn-primary flex-1">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Obra */}
      {showAddObraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Adicionar Obra</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Selecionar Obra</label>
                <select value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {allObras.map((o: any) => (<option key={o.id} value={o.id}>{o.nome} ({o.estado})</option>))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => { setShowAddObraModal(false); setSelectedObraId('') }} className="btn flex-1">Cancelar</button>
                <button onClick={handleAddObra} className="btn btn-primary flex-1">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendar Férias */}
      {showAddFerias && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Agendar Férias</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data Início</label>
                  <input type="date" className="input" value={feriasForm.data_inicio} onChange={e => setFeriasForm({...feriasForm, data_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="label">Data Fim</label>
                  <input type="date" className="input" value={feriasForm.data_fim} onChange={e => setFeriasForm({...feriasForm, data_fim: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <input className="input" value={feriasForm.observacoes} onChange={e => setFeriasForm({...feriasForm, observacoes: e.target.value})} placeholder="Opcional" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowAddFerias(false); setFeriasForm({ data_inicio: '', data_fim: '', observacoes: '' }) }} className="btn flex-1">Cancelar</button>
                <button onClick={handleAddFerias} className="btn btn-primary flex-1"><Calendar className="w-4 h-4" /> Agendar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}