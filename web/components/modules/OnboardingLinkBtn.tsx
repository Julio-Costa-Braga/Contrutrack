// web/components/modules/OnboardingLinkBtn.tsx
'use client'
import { useState } from 'react'
import { UserPlus, Copy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { criarLinkOnboarding } from '@/lib/actions/rh'

const DOCUMENTOS_OPCOES = [
  { id: 'cartao_cidadao',     nome: 'Cartão de Cidadão / Título de Residência' },
  { id: 'contrato_trabalho',  nome: 'NIF (documento fiscal)' },
  { id: 'atestado_medico',    nome: 'Atestado Médico de Aptidão' },
  { id: 'formacao_seguranca', nome: 'Certificado de Segurança' },
  { id: 'certificado_manobra',nome: 'Certificado de Manobra de Máquinas' },
  { id: 'outro',              nome: 'Outro documento' },
]

export default function OnboardingLinkBtn() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [documentos, setDocumentos] = useState<string[]>(
    DOCUMENTOS_OPCOES.filter(d => d.id !== 'outro').map(d => d.id)
  )
  const [loading, setLoading] = useState(false)
  const [linkGerado, setLinkGerado] = useState<string | null>(null)

  function toggleDocumento(id: string) {
    setDocumentos(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await criarLinkOnboarding({ nome, email, documentos_necessarios: documentos })
    if (result.link) {
      setLinkGerado(result.link)
      toast.success('Link criado com sucesso!')
      if (result.emailError) toast.error('Email não enviado: ' + result.emailError.slice(0, 80))
    } else {
      toast.error('Erro ao criar link')
    }
    setLoading(false)
  }

  function copiarLink() {
    if (linkGerado) {
      navigator.clipboard.writeText(linkGerado)
      toast.success('Link copiado!')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        <UserPlus className="w-4 h-4" /> Enviar link candidato
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-base font-semibold mb-4">Criar link de onboarding</h2>

            {!linkGerado ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="label">Nome do candidato</label>
                  <input className="input" value={nome} onChange={e => setNome(e.target.value)}
                    placeholder="João Silva" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="candidato@email.com" required />
                </div>

                <div>
                  <label className="label">Documentos necessários</label>
                  <div className="space-y-1.5 mt-1">
                    {DOCUMENTOS_OPCOES.map(doc => (
                      <label key={doc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={documentos.includes(doc.id)}
                          onChange={() => toggleDocumento(doc.id)}
                          className="rounded border-gray-300"
                        />
                        {doc.nome}
                      </label>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  O candidato receberá um link único para fazer upload guiado dos documentos selecionados.
                  O link expira em 7 dias.
                </p>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="btn flex-1 justify-center">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
                    {loading ? 'A criar...' : 'Criar link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Link criado com sucesso!</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all text-gray-700">
                  {linkGerado}
                </div>
                <div className="flex gap-2">
                  <button onClick={copiarLink} className="btn flex-1 justify-center">
                    <Copy className="w-4 h-4" /> Copiar link
                  </button>
                  <button onClick={() => { setOpen(false); setLinkGerado(null); setNome(''); setEmail(''); setDocumentos(DOCUMENTOS_OPCOES.filter(d => d.id !== 'outro').map(d => d.id)) }}
                    className="btn btn-primary flex-1 justify-center">
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
