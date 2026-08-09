'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserPlus, AlertTriangle, FileText, Trash2, Loader } from 'lucide-react'
import OnboardingLinkBtn from '@/components/modules/OnboardingLinkBtn'

export default function RHPage() {
  const supabase = createClient()
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    const [funcRes, docsRes, linksRes] = await Promise.all([
      supabase.from('funcionarios').select('*').eq('ativo', true).is('deleted_at', null).order('nome_completo'),
      supabase.from('documentos_funcionario')
        .select('*, funcionarios(nome_completo)')
        .in('estado', ['expirado', 'a_expirar'])
        .order('data_validade'),
      supabase.from('onboarding_links')
        .select('*').eq('usado', false)
        .gt('expira_em', new Date().toISOString())
        .order('created_at', { ascending: false }).limit(5),
    ])
    setFuncionarios(funcRes.data || [])
    setDocs(docsRes.data || [])
    setLinks(linksRes.data || [])
    setLoading(false)
  }

  async function handleDeleteFuncionario(id: string) {
    if (!confirm('Mover para a lixeira?')) return
    const { error } = await supabase.from('funcionarios').update({ deleted_at: new Date().toISOString(), ativo: false }).eq('id', id)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Movido para lixeira!'); loadData() }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">RH &amp; Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dossiês digitais · conformidade legal</p>
        </div>
        <div className="flex gap-2">
          <OnboardingLinkBtn />
          <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200">
            <Trash2 className="w-4 h-4" /> Lixeira
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Alertas SHT */}
          {docs.length > 0 && (
            <div className="card mb-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas de conformidade SHT
              </h2>
              <div className="space-y-2">
                {docs.map((d: any) => (
                  <div key={d.id} className={`p-3 rounded-lg text-xs border ${
                    d.estado === 'expirado' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`font-semibold ${d.estado === 'expirado' ? 'text-red-800' : 'text-amber-800'}`}>
                          {d.funcionarios?.nome_completo}
                        </span>
                        <span className={d.estado === 'expirado' ? 'text-red-700' : 'text-amber-700'}>
                          {' '}— {d.nome}
                        </span>
                      </div>
                      <span className={`pill ${d.estado === 'expirado' ? 'pill-red' : 'pill-amber'}`}>
                        {d.estado === 'expirado' ? 'VENCIDO' : `vence ${d.data_validade}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <h2 className="text-sm font-semibold mb-3">Links de onboarding ativos</h2>
              {links.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum link ativo.</p>
              ) : (
                <div className="space-y-2">
                  {links.map((l: any) => (
                    <div key={l.id} className="flex items-center gap-2 text-xs border border-gray-200 rounded-lg p-2.5">
                      <div className="flex-1">
                        <p className="font-medium">{l.nome_candidato ?? l.email_candidato}</p>
                        <p className="text-gray-500">{l.email_candidato}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/${l.token}`)}
                        className="text-blue-600 underline"
                      >Copiar link</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold mb-3">Resumo de conformidade</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total funcionários ativos</span>
                  <span className="font-semibold">{funcionarios.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Docs expirados</span>
                  <span className="font-semibold text-red-600">
                    {docs.filter((d: any) => d.estado === 'expirado').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Docs a expirar (&lt;30d)</span>
                  <span className="font-semibold text-amber-600">
                    {docs.filter((d: any) => d.estado === 'a_expirar').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Nome','NIF','NISS','Admissão','Dossiê','Ações'].map(h => (
                    <th key={h} className="text-left pb-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 font-medium">{f.nome_completo}</td>
                    <td className="py-2.5 text-gray-500">{f.nif ? f.nif.slice(0,6)+'***' : '—'}</td>
                    <td className="py-2.5 text-gray-500">{f.niss ? f.niss.slice(0,4)+'***' : '—'}</td>
                    <td className="py-2.5">{f.data_admissao ?? '—'}</td>
                    <td className="py-2.5">
                      {f.dossie_path
                        ? <span className="pill pill-green">✓ Criado</span>
                        : <span className="pill pill-gray">Pendente</span>}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <Link href={`/rh/${f.id}`} className="text-blue-600 underline">Ver dossiê</Link>
                        <button onClick={() => handleDeleteFuncionario(f.id)} className="p-1 rounded hover:bg-red-100 text-red-600 ml-2" title="Eliminar">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
