// web/app/onboarding/[token]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DOCUMENTOS_CATALOGO: Record<string, string> = {
  cartao_cidadao:     'Cartão de Cidadão / Título de Residência',
  contrato_trabalho:  'NIF (documento fiscal)',
  atestado_medico:    'Atestado Médico de Aptidão',
  formacao_seguranca: 'Certificado de Segurança',
  certificado_manobra:'Certificado de Manobra de Máquinas',
  outro:              'Outro documento',
}

export default function OnboardingPage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const [link, setLink]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invalido, setInvalido] = useState(false)
  const [uploads, setUploads] = useState<Record<string, File>>({})
  const [enviado, setEnviado] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [documentosNecessarios, setDocumentosNecessarios] = useState<{ id: string; nome: string; obrigatorio: boolean }[]>([])

  useEffect(() => {
    supabase.from('onboarding_links')
      .select('*')
      .eq('token', params.token)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setInvalido(true)
        } else {
          setLink(data)
          const docsIds: string[] = data.documentos_necessarios || [
            'cartao_cidadao', 'contrato_trabalho', 'atestado_medico',
            'formacao_seguranca', 'certificado_manobra',
          ]
          setDocumentosNecessarios(docsIds.map((id: string) => ({
            id,
            nome: DOCUMENTOS_CATALOGO[id] || id,
            obrigatorio: id !== 'formacao_seguranca' && id !== 'certificado_manobra' && id !== 'outro',
          })))
        }
        setLoading(false)
      })
  }, [params.token])

  function handleFile(docId: string, file: File) {
    setUploads(u => ({ ...u, [docId]: file }))
  }

  async function handleSubmit() {
    const obrigatorios = documentosNecessarios.filter(d => d.obrigatorio)
    const faltam = obrigatorios.filter(d => !uploads[d.id])
    if (faltam.length > 0) {
      toast.error(`Documentos obrigatórios em falta: ${faltam.map(d => d.nome).join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const nomeSlug = link.nome_candidato?.toUpperCase().replace(/\s+/g,'_') ?? 'CANDIDATO'
      const { data: func, error: funcError } = await supabase.from('funcionarios').insert({
        nome_completo: link.nome_candidato ?? link.email_candidato,
        email: link.email_candidato,
        dossie_path: `${nomeSlug}_PENDENTE/`,
      }).select('id').single()

      if (funcError) throw funcError

      for (const [docId, file] of Object.entries(uploads)) {
        const nomeSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${func.id}/${docId}/${Date.now()}_${nomeSeguro}`
        const { error: upErr } = await supabase.storage.from('documentos-rh').upload(path, file)
        if (upErr) { console.error('Upload error:', docId, upErr); continue }

        const { data: urlData } = supabase.storage.from('documentos-rh').getPublicUrl(path)
        const doc = documentosNecessarios.find(d => d.id === docId)

        await supabase.from('documentos_funcionario').insert({
          funcionario_id: func.id,
          tipo: docId as any,
          nome: doc?.nome ?? docId,
          ficheiro_url: urlData.publicUrl,
          ficheiro_path: path,
        })
      }

      await supabase.from('onboarding_links')
        .update({ usado: true, funcionario_id: func.id })
        .eq('token', params.token)

      setEnviado(true)
      toast.success('Documentos enviados com sucesso!')
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar documentos')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (invalido) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h1 className="text-base font-semibold mb-2">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-500">
          Este link de onboarding já foi utilizado ou expirou. Contacte o RH da empresa.
        </p>
      </div>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold mb-2">Documentos enviados!</h1>
        <p className="text-sm text-gray-500">
          Os seus documentos foram recebidos com sucesso. A equipa de RH irá analisá-los
          e entrará em contacto brevemente.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 16 16">
              <rect x="1" y="8" width="4" height="6" rx=".8" fill="currentColor" opacity=".8"/>
              <rect x="6" y="5" width="4" height="9" rx=".8" fill="currentColor"/>
              <rect x="11" y="2" width="4" height="12" rx=".8" fill="currentColor" opacity=".6"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold">ConstruTrack</div>
            <div className="text-xs text-gray-400">Onboarding Digital</div>
          </div>
        </div>

        <div className="card mb-4">
          <h1 className="text-base font-semibold mb-1">Bem-vindo(a), {link.nome_candidato}!</h1>
          <p className="text-sm text-gray-500">
            Faça o upload dos seus documentos de forma segura. Os documentos marcados com
            <span className="text-red-500">*</span> são obrigatórios.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {documentosNecessarios.map(doc => (
            <div key={doc.id} className={`card ${uploads[doc.id] ? 'border-green-200 bg-green-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {doc.nome}
                    {doc.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {uploads[doc.id] && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {uploads[doc.id].name}
                    </p>
                  )}
                </div>
                <label className={`btn cursor-pointer flex-shrink-0 ${uploads[doc.id] ? 'border-green-300 text-green-700' : ''}`}>
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">{uploads[doc.id] ? 'Alterar' : 'Enviar'}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => e.target.files?.[0] && handleFile(doc.id, e.target.files[0])}
                    className="hidden" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary w-full justify-center py-3">
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {submitting ? 'A enviar...' : 'Enviar todos os documentos'}
        </button>

        <p className="text-xs text-center text-gray-400 mt-4">
          Os seus dados são tratados de forma confidencial e segura conforme o RGPD.
        </p>
      </div>
    </div>
  )
}