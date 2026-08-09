'use client'
import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, ShoppingCart, Loader, ChevronDown, ChevronRight, FileText, Trash2 } from 'lucide-react'
import AprovarRequisicaoBtn from '@/components/modules/AprovarRequisicaoBtn'
import toast from 'react-hot-toast'

export default function ComprasPage() {
  const supabase = createClient()
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [perfis, setPerfis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)

    const [r, o, t, p] = await Promise.all([
      supabase.from('requisicoes').select('*, obras(nome), perfis!criado_por(nome_completo)').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
      supabase.from('obras').select('id,nome').eq('estado', 'ativa'),
      supabase.from('transacoes').select('*'),
      supabase.from('perfis').select('id, nome_completo'),
    ])

    setRequisicoes(r.data || [])
    setObras(o.data || [])
    setTransacoes(t.data || [])
    setPerfis(p.data || [])
    setLoading(false)
  }

  async function migrarRequisicoes() {
    if (!confirm('Atualizar todas as requisições para aguarda_aprovacao_financeiro?')) return
    setLoading(true)
    const { error } = await supabase
      .from('requisicoes')
      .update({ estado: 'aguarda_aprovacao_financeiro' })
      .eq('estado', 'aguarda_cotacao')
    
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Requisições atualizadas!'); loadData() }
    setLoading(false)
  }

  async function handleDeleteRequisicao(id: string) {
    if (!confirm('Mover para a lixeira?')) return
    const { error } = await supabase.from('requisicoes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Movido para lixeira!'); loadData() }
  }

  useEffect(() => { loadData() }, [])

  const pendentes = requisicoes.filter(r => ['aguarda_aprovacao_financeiro', 'rascunho'].includes(r.estado))
  const aprovadas = requisicoes.filter(r => ['aprovado','entregue','fechado'].includes(r.estado))

  function getTransacoes(requisicao: any) {
    return transacoes.filter(t => t.descricao?.toLowerCase().includes(requisicao.titulo?.toLowerCase() || '') || t.obra_id === requisicao.obra_id)
  }

  function getPerfilNome(id: string | null) {
    if (!id) return '—'
    const p = perfis.find(p => p.id === id)
    return p?.nome_completo || '—'
  }

  function getEstadoColor(estado: string) {
    if (['aprovado', 'fechado', 'entregue'].includes(estado)) return 'pill-green'
    if (estado === 'rejeitado') return 'pill-red'
    if (estado === 'rascunho') return 'pill-gray'
    return 'pill-amber'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Compras & Logística</h1>
          <p className="text-sm text-gray-500 mt-0.5">Requisições · cotações OCR · aprovações</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadData} className="btn" disabled={loading}>
            <Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <Link href="/compras/nova" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Nova requisição
          </Link>
          <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200">
            <Trash2 className="w-4 h-4" /> Lixeira
          </Link>
          {requisicoes.some(r => r.estado === 'aguarda_cotacao') && (
            <button onClick={migrarRequisicoes} className="btn bg-amber-100 text-amber-800 hover:bg-amber-200">
              Migrar para aprovações
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total requisições', value: requisicoes.length },
          { label: 'Aguardam aprovação', value: pendentes.length, danger: pendentes.length > 0 },
          { label: 'Aprovadas', value: aprovadas.length },
          {
            label: 'Valor pendente',
            value: '€' + pendentes.reduce((s, r) => s + (r.valor_estimado ?? 0), 0).toLocaleString('pt-PT'),
          },
        ].map(m => (
          <div key={m.label} className="card">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-semibold ${m.danger ? 'text-amber-600' : ''}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-500" />
            Aguardam aprovação ({pendentes.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['','Título','Obra','Valor Estimado','Criado por','Criado em','Ações'].map(h => (
                    <th key={h} className="text-left pb-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendentes.map(r => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-3">
                      <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-gray-400 hover:text-gray-600">
                        {expandedId === r.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 font-medium">{r.titulo}</td>
                    <td className="py-3 pl-4 text-gray-600">{r.obras?.nome || '—'}</td>
                    <td className="py-3 pl-4">€{r.valor_estimado?.toLocaleString('pt-PT') || '—'}</td>
                    <td className="py-3 pl-4 text-gray-600">{r.perfis?.nome_completo || '—'}</td>
                    <td className="py-3 pl-4 text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-PT') : '—'}
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleDeleteRequisicao(r.id)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Eliminar">X</button>
                        <AprovarRequisicaoBtn id={r.id} titulo={r.titulo} valor={r.valor_estimado} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Todas */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Todas as requisições ({requisicoes.length})</h2>
        {loading ? (
          <p className="text-gray-400">A carregar...</p>
        ) : requisicoes.length === 0 ? (
          <p className="text-gray-400">Nenhuma requisição. <Link href="/compras/nova" className="text-blue-600">Criar primeira</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['','Título','Obra','Valor Est.','Valor Real','Estado','Criado por','Data','Ações'].map(h => (
                    <th key={h} className="text-left pb-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
            <tbody>
              {requisicoes.map(r => {
                const relT = transacoes.filter(t => t.obra_id === r.obra_id && t.tipo === 'despesa')
                const valorReal = relT.reduce((s, t) => s + t.valor, 0)
                const isExpanded = expandedId === r.id
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 font-medium">{r.titulo}</td>
                      <td className="py-3 pl-4 text-gray-600">{r.obras?.nome || '—'}</td>
                      <td className="py-3 pl-4">€{r.valor_estimado?.toLocaleString('pt-PT') || '—'}</td>
                      <td className={`py-3 pl-4 font-medium ${valorReal > (r.valor_estimado || 0) ? 'text-red-600' : 'text-green-600'}`}>
                        {valorReal > 0 ? '€' + valorReal.toLocaleString('pt-PT') : '—'}
                      </td>
                      <td className="py-3 pl-4">
                        <span className={`pill ${getEstadoColor(r.estado)}`}>
                          {r.estado.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-gray-600">{r.perfis?.nome_completo || '—'}</td>
                      <td className="py-3 pl-4 text-gray-500">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-PT') : '—'}
                      </td>
                      <td className="py-3 pl-4">
                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="text-blue-600 hover:text-blue-800 text-xs whitespace-nowrap">
                          Ver mais
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="py-4 px-6">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Detalhes da Requisição</h4>
                              <div className="space-y-1.5">
                                <p><span className="text-gray-500">Descrição:</span> {r.descricao || '—'}</p>
                                <p><span className="text-gray-500">IVA Autoliquidação:</span> {r.iva_autoliquidacao ? '✓ Sim' : '✗ Não'}</p>
                                {r.quantidade && <p><span className="text-gray-500">Quantidade:</span> {r.quantidade} {r.unidade || ''}</p>}
                                <p><span className="text-gray-500">Criado por:</span> {r.perfis?.nome_completo || '—'}</p>
                                <p><span className="text-gray-500">Criado em:</span> {r.created_at ? new Date(r.created_at).toLocaleString('pt-PT') : '—'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Aprovação</h4>
                              <div className="space-y-1.5">
                                {r.estado === 'aprovado' || r.estado === 'fechado' ? (
                                  <>
                                    <p><span className="text-gray-500">Aprovado por:</span> {getPerfilNome(r.aprovado_por)}</p>
                                    <p><span className="text-gray-500">Aprovado em:</span> {r.aprovado_em ? new Date(r.aprovado_em).toLocaleString('pt-PT') : '—'}</p>
                                  </>
                                ) : r.estado === 'rejeitado' ? (
                                  <>
                                    <p><span className="text-gray-500">Rejeitado por:</span> {getPerfilNome(r.aprovado_por)}</p>
                                    <p><span className="text-gray-500">Motivo:</span> {r.motivo_rejeicao || '—'}</p>
                                  </>
                                ) : (
                                  <p className="text-gray-400">A aguardar aprovação</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}