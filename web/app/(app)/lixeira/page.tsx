'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Trash2, RotateCcw, Clock, Loader, AlertTriangle } from 'lucide-react'

type Tab = 'todos' | 'requisicoes' | 'transacoes' | 'obras' | 'funcionarios' | 'cotacoes'

export default function LixeiraPage() {
  const supabase = createClient()
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [cotacoes, setCotacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('todos')
  const [obrasPermitidas, setObrasPermitidas] = useState<string[] | null>(null) // null = admin (todas)

  async function getObrasPermitidas(): Promise<string[] | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: perfil } = await supabase.from('perfis').select('papel').eq('id', user.id).single()
    if (!perfil) return []
    if (perfil.papel === 'administrador') return null // null = todas as obras
    const { data: gerentes } = await supabase.from('obra_gerentes').select('obra_id').eq('perfil_id', user.id)
    return gerentes?.map(g => g.obra_id) || []
  }

  async function loadData() {
    setLoading(true)
    const [obrasIds, cincoDiasAtras] = [await getObrasPermitidas(), new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()]

    const baseQuery = (table: string, select: string) => {
      let q = supabase.from(table).select(select).not('deleted_at', 'is', null).gte('deleted_at', cincoDiasAtras)
      if (obrasIds !== null && table !== 'funcionarios') {
        const fk = table === 'requisicoes' || table === 'transacoes' ? 'obra_id' : 'id'
        q = q.in(fk, obrasIds.length > 0 ? obrasIds : ['00000000-0000-0000-0000-000000000000'])
      }
      return q.order('deleted_at', { ascending: false })
    }

    const [reqRes, transRes, obrasRes, funcRes, cotRes] = await Promise.all([
      baseQuery('requisicoes', '*, obras(nome)'),
      baseQuery('transacoes', '*, obra:obra_id(nome)'),
      baseQuery('obras', '*'),
      supabase.from('funcionarios').select('*').not('deleted_at', 'is', null).gte('deleted_at', cincoDiasAtras).order('deleted_at', { ascending: false }),
      baseQuery('cotacoes', '*'),
    ])
    setRequisicoes(reqRes.data || [])
    setTransacoes(transRes.data || [])
    setObras(obrasRes.data || [])
    setFuncionarios(funcRes.data || [])
    setCotacoes(cotRes.data || [])
    setLoading(false)
  }

  async function handleRestaurar(tabela: string, id: string) {
    const { error } = await supabase.from(tabela).update({ deleted_at: null }).eq('id', id)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Restaurado!'); loadData() }
  }

  async function handleEliminarPermanente(tabela: string, id: string) {
    if (!confirm('Eliminar permanentemente? Esta ação não pode ser desfeita.')) return
    if (tabela === 'funcionarios') {
      await supabase.from('documentos_funcionario').delete().eq('funcionario_id', id)
      await supabase.from('funcionario_obras').delete().eq('funcionario_id', id)
      await supabase.from('registos_ponto').delete().eq('funcionario_id', id)
      await supabase.from('ferias_funcionario').delete().eq('funcionario_id', id)
      await supabase.from('onboarding_links').update({ funcionario_id: null }).eq('funcionario_id', id)
    }
    if (tabela === 'obras') {
      await supabase.from('funcionario_obras').delete().eq('obra_id', id)
      await supabase.from('obra_gerentes').delete().eq('obra_id', id)
      await supabase.from('alertas').delete().eq('obra_id', id)
    }
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Eliminado permanentemente!'); loadData() }
  }

  function tempoRestante(deletedAt: string) {
    const fim = new Date(deletedAt).getTime() + 5 * 24 * 60 * 60 * 1000
    const agora = Date.now()
    const diff = fim - agora
    if (diff <= 0) return 'Expira hoje'
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${horas}h ${mins}m`
  }

  useEffect(() => { loadData() }, [])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: requisicoes.length + transacoes.length + obras.length + funcionarios.length + cotacoes.length },
    { key: 'requisicoes', label: 'Requisições', count: requisicoes.length },
    { key: 'transacoes', label: 'Transações', count: transacoes.length },
    { key: 'obras', label: 'Obras', count: obras.length },
    { key: 'funcionarios', label: 'Funcionários', count: funcionarios.length },
    { key: 'cotacoes', label: 'Cotações', count: cotacoes.length },
  ]

  const total = tabs.find(t => t.key === 'todos')?.count || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-500" /> Lixeira
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Itens eliminados — expiram em 5 dias</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn" disabled={loading}>
            <Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <Link href="/compras" className="btn">Compras</Link>
          <Link href="/financeiro" className="btn">Financeiro</Link>
          <Link href="/obras" className="btn">Estaleiros</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${tab === t.key ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : total === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Lixeira vazia</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Requisições */}
          {(tab === 'todos' || tab === 'requisicoes') && requisicoes.length > 0 && (
            <Section title="Requisições" count={requisicoes.length}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-500">Título</th>
                    <th className="text-left pb-3 text-gray-500">Obra</th>
                    <th className="text-left pb-3 text-gray-500">Estado</th>
                    <th className="text-left pb-3 text-gray-500">Eliminado em</th>
                    <th className="text-left pb-3 text-gray-500">Expira em</th>
                    <th className="text-left pb-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requisicoes.map(r => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{r.titulo}</td>
                      <td className="py-3 text-gray-600">{r.obras?.nome || '—'}</td>
                      <td className="py-3"><span className="pill pill-amber">{r.estado?.replace(/_/g, ' ')}</span></td>
                      <td className="py-3 text-gray-500">{new Date(r.deleted_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> {tempoRestante(r.deleted_at)}</span></td>
                      <td className="py-3"><Acoes tabela="requisicoes" id={r.id} onRestaurar={handleRestaurar} onEliminar={handleEliminarPermanente} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Transações */}
          {(tab === 'todos' || tab === 'transacoes') && transacoes.length > 0 && (
            <Section title="Transações" count={transacoes.length}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-500">Descrição</th>
                    <th className="text-left pb-3 text-gray-500">Valor</th>
                    <th className="text-left pb-3 text-gray-500">Tipo</th>
                    <th className="text-left pb-3 text-gray-500">Obra</th>
                    <th className="text-left pb-3 text-gray-500">Eliminado em</th>
                    <th className="text-left pb-3 text-gray-500">Expira em</th>
                    <th className="text-left pb-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map(t => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{t.descricao}</td>
                      <td className="py-3">€{t.valor?.toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className={`pill ${t.tipo === 'receita' ? 'pill-green' : 'pill-red'}`}>{t.tipo}</span></td>
                      <td className="py-3 text-gray-600">{t.obra?.nome || '—'}</td>
                      <td className="py-3 text-gray-500">{new Date(t.deleted_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> {tempoRestante(t.deleted_at)}</span></td>
                      <td className="py-3"><Acoes tabela="transacoes" id={t.id} onRestaurar={handleRestaurar} onEliminar={handleEliminarPermanente} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Obras */}
          {(tab === 'todos' || tab === 'obras') && obras.length > 0 && (
            <Section title="Obras" count={obras.length}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-500">Nome</th>
                    <th className="text-left pb-3 text-gray-500">Estado</th>
                    <th className="text-left pb-3 text-gray-500">Cidade</th>
                    <th className="text-left pb-3 text-gray-500">Eliminado em</th>
                    <th className="text-left pb-3 text-gray-500">Expira em</th>
                    <th className="text-left pb-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.map(o => (
                    <tr key={o.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{o.nome}</td>
                      <td className="py-3"><span className={`pill ${o.estado === 'ativa' ? 'pill-green' : 'pill-gray'}`}>{o.estado}</span></td>
                      <td className="py-3 text-gray-600">{o.cidade || '—'}</td>
                      <td className="py-3 text-gray-500">{new Date(o.deleted_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> {tempoRestante(o.deleted_at)}</span></td>
                      <td className="py-3"><Acoes tabela="obras" id={o.id} onRestaurar={handleRestaurar} onEliminar={handleEliminarPermanente} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Funcionários */}
          {(tab === 'todos' || tab === 'funcionarios') && funcionarios.length > 0 && (
            <Section title="Funcionários" count={funcionarios.length}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-500">Nome</th>
                    <th className="text-left pb-3 text-gray-500">Cargo</th>
                    <th className="text-left pb-3 text-gray-500">Setor</th>
                    <th className="text-left pb-3 text-gray-500">Eliminado em</th>
                    <th className="text-left pb-3 text-gray-500">Expira em</th>
                    <th className="text-left pb-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map(f => (
                    <tr key={f.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{f.nome_completo}</td>
                      <td className="py-3 text-gray-600">{f.cargo || '—'}</td>
                      <td className="py-3 text-gray-600">{f.setor || '—'}</td>
                      <td className="py-3 text-gray-500">{new Date(f.deleted_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> {tempoRestante(f.deleted_at)}</span></td>
                      <td className="py-3"><Acoes tabela="funcionarios" id={f.id} onRestaurar={handleRestaurar} onEliminar={handleEliminarPermanente} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Cotações */}
          {(tab === 'todos' || tab === 'cotacoes') && cotacoes.length > 0 && (
            <Section title="Cotações" count={cotacoes.length}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-500">Cliente</th>
                    <th className="text-left pb-3 text-gray-500">Descrição</th>
                    <th className="text-left pb-3 text-gray-500">Valor</th>
                    <th className="text-left pb-3 text-gray-500">Eliminado em</th>
                    <th className="text-left pb-3 text-gray-500">Expira em</th>
                    <th className="text-left pb-3 text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoes.map(c => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{c.cliente}</td>
                      <td className="py-3 text-gray-600">{c.descricao}</td>
                      <td className="py-3">€{c.valor_base?.toLocaleString('pt-PT')}</td>
                      <td className="py-3 text-gray-500">{new Date(c.deleted_at).toLocaleString('pt-PT')}</td>
                      <td className="py-3"><span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" /> {tempoRestante(c.deleted_at)}</span></td>
                      <td className="py-3"><Acoes tabela="cotacoes" id={c.id} onRestaurar={handleRestaurar} onEliminar={handleEliminarPermanente} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        {title} ({count})
      </h2>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function Acoes({ tabela, id, onRestaurar, onEliminar }: { tabela: string; id: string; onRestaurar: (t: string, id: string) => void; onEliminar: (t: string, id: string) => void }) {
  return (
    <div className="flex gap-1">
      <button onClick={() => onRestaurar(tabela, id)} className="p-1.5 rounded hover:bg-green-100 text-green-600" title="Restaurar">
        <RotateCcw className="w-4 h-4" />
      </button>
      <button onClick={() => onEliminar(tabela, id)} className="p-1.5 rounded hover:bg-red-100 text-red-600" title="Eliminar permanentemente">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
