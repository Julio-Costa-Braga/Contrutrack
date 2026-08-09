'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserPlus, Copy, ExternalLink, CheckCircle, XCircle, Loader } from 'lucide-react'
import OnboardingLinkBtn from '@/components/modules/OnboardingLinkBtn'

export default function ContratacaoPage() {
  const supabase = createClient()
  const [candidatos, setCandidatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState<string | null>(null)

  async function loadCandidatos() {
    setLoading(true)
    const { data } = await supabase
      .from('onboarding_links')
      .select('*')
      .order('created_at', { ascending: false })
    setCandidatos(data || [])
    setLoading(false)
  }

  useEffect(() => { loadCandidatos() }, [])

  async function copiarLink(token: string) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding/${token}`
    await navigator.clipboard.writeText(link)
    setCopiado(token)
    toast.success('Link copiado!')
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Contratação</h1>
          <p className="text-sm text-gray-500 mt-0.5">Onboarding e envio de documentos</p>
        </div>
        <OnboardingLinkBtn />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                {['Candidato', 'Email', 'Criado em', 'Expira em', 'Documentos', 'Estado', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidatos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Nenhum candidato encontrado. Crie o primeiro link de onboarding.
                  </td>
                </tr>
              ) : candidatos.map((c: any) => {
                const expirado = new Date(c.expira_em) < new Date()
                return (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 font-medium">{c.nome_candidato || '—'}</td>
                    <td className="py-2.5 text-gray-500">{c.email_candidato}</td>
                    <td className="py-2.5">
                      {new Date(c.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-2.5">
                      <span className={expirado ? 'text-red-600' : ''}>
                        {new Date(c.expira_em).toLocaleDateString('pt-PT')}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.documentos_necessarios || []).map((d: string) => (
                          <span key={d} className="pill pill-gray text-[10px]">{d.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5">
                      {c.usado ? (
                        <span className="pill pill-green flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Completo
                        </span>
                      ) : expirado ? (
                        <span className="pill pill-red flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Expirado
                        </span>
                      ) : (
                        <span className="pill pill-amber flex items-center gap-1 w-fit">
                          <ExternalLink className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {!c.usado && !expirado && (
                        <button onClick={() => copiarLink(c.token)} className="text-blue-600 underline flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          {copiado === c.token ? 'Copiado!' : 'Copiar link'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}