'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, TrendingUp, TrendingDown, DollarSign, Loader, CheckCircle, XCircle, Clock, Users, ChevronLeft, ChevronRight, Bell, BellOff, AlertTriangle, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'

type TransacaoTipo = 'receita' | 'despesa'

const CATEGORIAS_RECEITA = ['Orçamento', 'Adiantamento', 'Finalizacao']
const CATEGORIAS_DESPESA = ['Materiais', 'Mao de Obra', 'Equipamentos', 'Transporte', 'Subcontractos', 'Administrativo']

export default function FinanceiroPage() {
  const supabase = createClient()
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [categoriaCustom, setCategoriaCustom] = useState(false)
  const [aba, setAba] = useState<'geral' | 'funcionarios'>('geral')
  const [mesAtual, setMesAtual] = useState(new Date())
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa' as TransacaoTipo,
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    obra_id: '',
    fornecedor: '',
    lembrete: false,
    lembrete_dias: 3,
    recorrente: false,
    recorrente_tipo: 'mensal' as string,
  })

  const inicio = startOfMonth(mesAtual)
  const fim = endOfMonth(mesAtual)

  useEffect(() => { loadData() }, [mesAtual])

  async function loadData() {
    setLoading(true)
    const [transRes, obrasRes, funcRes] = await Promise.all([
      supabase
        .from('transacoes')
        .select('*, obra:obra_id(nome), aprovador:aprovado_por(nome_completo)')
        .is('deleted_at', null)
        .gte('data', inicio.toISOString().split('T')[0])
        .lte('data', fim.toISOString().split('T')[0])
        .order('data', { ascending: false }),
      supabase.from('obras').select('id, nome').eq('estado', 'ativa'),
      supabase.from('funcionarios').select('id, nome_completo, salario_base, cargo, setor').eq('ativo', true),
    ])
    setTransacoes(transRes.data || [])
    setObras(obrasRes.data || [])
    setFuncionarios(funcRes.data || [])
    setLoading(false)
  }

  async function recalcularCustoObras() {
    await supabase.from('obras').update({ custo_real: 0 }).neq('id', '00000000-0000-0000-0000-000000000000')
    const { data: despesas } = await supabase.from('transacoes').select('obra_id, valor').eq('tipo', 'despesa').is('deleted_at', null)
    if (!despesas) return
    const porObra: Record<string, number> = {}
    for (const d of despesas) {
      if (d.obra_id) porObra[d.obra_id] = (porObra[d.obra_id] || 0) + d.valor
    }
    await Promise.all(Object.entries(porObra).map(([obraId, valor]) =>
      supabase.from('obras').update({ custo_real: valor }).eq('id', obraId)
    ))
  }

  function handleEditTransacao(t: any) {
    const isCustom = t.categoria && ![...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].includes(t.categoria)
    setCategoriaCustom(!!isCustom)
    setForm({
      descricao: t.descricao,
      valor: t.valor.toString(),
      tipo: t.tipo,
      categoria: t.categoria || '',
      data: t.data,
      obra_id: t.obra_id || '',
      fornecedor: t.fornecedor || '',
      lembrete: t.lembrete || false,
      lembrete_dias: t.lembrete_dias || 3,
      recorrente: t.recorrente || false,
      recorrente_tipo: t.recorrente_tipo || 'mensal',
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  function handleEditSalario(f: any) {
    setForm({
      descricao: `Salário - ${f.nome_completo}`,
      valor: f.salario_base?.toString() || '',
      tipo: 'despesa',
      categoria: 'Mao de Obra',
      data: format(new Date(), 'yyyy-MM-dd'),
      obra_id: '',
      fornecedor: f.nome_completo,
      lembrete: true,
      lembrete_dias: 3,
      recorrente: true,
      recorrente_tipo: 'mensal',
    })
    setEditingId(null)
    setCategoriaCustom(false)
    setShowModal(true)
  }

  async function handleDeleteTransacao(id: string) {
    if (!confirm('Mover para a lixeira?')) return
    const { data: t } = await supabase.from('transacoes').select('requisicao_id, obra_id, valor').eq('id', id).single()
    if (t?.requisicao_id) {
      await supabase.from('requisicoes').update({ estado: 'aguarda_aprovacao_financeiro', aprovado_por: null, aprovado_em: null }).eq('id', t.requisicao_id)
    }
    await supabase.from('transacoes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    await recalcularCustoObras()
    toast.success('Movido para lixeira!')
    loadData()
  }

  async function handleAprovar(id: string, estado: 'aprovado' | 'rejeitado') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transacoes').update({
      estado_aprovacao: estado,
      aprovado_por: user?.id || null,
      aprovado_em: new Date().toISOString(),
    }).eq('id', id)
    toast.success(estado === 'aprovado' ? 'Aprovado!' : 'Rejeitado!')
    loadData()
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    const dados: any = {
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      categoria: form.categoria,
      data: form.data,
      obra_id: form.obra_id || null,
      fornecedor: form.fornecedor || null,
      lembrete: form.lembrete,
      lembrete_dias: form.lembrete ? form.lembrete_dias : null,
      recorrente: form.recorrente,
      recorrente_tipo: form.recorrente ? form.recorrente_tipo : null,
    }
    let error
    if (editingId) {
      const r = await supabase.from('transacoes').update(dados).eq('id', editingId)
      error = r.error
    } else {
      const r = await supabase.from('transacoes').insert(dados)
      error = r.error
    }
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(editingId ? 'Atualizado!' : 'Registado!')
      await recalcularCustoObras()
      setShowModal(false)
      setEditingId(null)
      setCategoriaCustom(false)
      loadData()
    }
  }

  const filtradas = filtroTipo === 'todos' ? transacoes : transacoes.filter(t => t.tipo === filtroTipo)
  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalReceitas - totalDespesas
  const totalSalarios = funcionarios.reduce((s, f) => s + (f.salario_base || 0), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn" disabled={loading}><Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</button>
          <button onClick={() => { setEditingId(null); setCategoriaCustom(false); setShowModal(true) }} className="btn btn-primary"><Plus className="w-4 h-4" />Nova Transacao</button>
          <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200"><Trash2 className="w-4 h-4" />Lixeira</Link>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))} className="btn btn-sm">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-semibold">{format(mesAtual, 'MMMM yyyy', { locale: pt })}</h2>
        <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))} className="btn btn-sm">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 text-green-600 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-xs font-medium">Receitas</span></div>
          <p className="text-2xl font-semibold text-green-600">{'EUR ' + totalReceitas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-red-600 mb-1"><TrendingDown className="w-4 h-4" /><span className="text-xs font-medium">Despesas</span></div>
          <p className="text-2xl font-semibold text-red-600">{'EUR ' + totalDespesas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-red-600 mb-1"><Users className="w-4 h-4" /><span className="text-xs font-medium">Salários (mês)</span></div>
          <p className="text-2xl font-semibold text-red-600">{'EUR ' + totalSalarios.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-slate-600 mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs font-medium">Saldo</span></div>
          <p className={`text-2xl font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{'EUR ' + saldo.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setAba('geral')} className={`px-4 py-2 rounded-lg text-sm font-medium ${aba === 'geral' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Geral</button>
        <button onClick={() => setAba('funcionarios')} className={`px-4 py-2 rounded-lg text-sm font-medium ${aba === 'funcionarios' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Users className="w-4 h-4 inline mr-1" />Funcionários
        </button>
      </div>

      {aba === 'funcionarios' && (
        <div className="card overflow-hidden overflow-x-auto mb-6">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Funcionário</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Cargo</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Setor</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Salário Base</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum funcionário ativo</td></tr>
              ) : funcionarios.map(f => (
                <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{f.nome_completo}</td>
                  <td className="py-3 px-4 text-gray-500">{f.cargo || '—'}</td>
                  <td className="py-3 px-4 text-gray-500">{f.setor || '—'}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {f.salario_base ? 'EUR ' + f.salario_base.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleEditSalario(f)} className="text-blue-600 hover:text-blue-800 text-xs" disabled={!f.salario_base}>
                      {f.salario_base ? 'Criar despesa' : 'Sem salário'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total salários mensais:</span>
              <span className="text-red-600">{'EUR ' + totalSalarios.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {aba === 'geral' && (
        <>
         <div className="flex gap-2 mb-4">
           {['todos', 'receita', 'despesa'].map(tipo => (
             <button key={tipo} onClick={() => setFiltroTipo(tipo)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtroTipo === tipo ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
               {tipo === 'todos' ? 'Todos' : tipo === 'receita' ? 'Receitas' : 'Despesas'}
             </button>
           ))}
         </div>

         <div className="mb-4">
           <Link href="/financeiro/aprovacoes" className="btn w-full justify-center">
             <CheckCircle className="w-4 h-4" /> Ver Aprovações Pendentes
           </Link>
         </div>

        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Data</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Descricao</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Categoria</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Obra</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Alerta</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Valor</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">Nenhuma transacao neste mês</td></tr>
              ) : (
                filtradas.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p>{new Date(t.data).toLocaleDateString('pt-PT')}</p>
                      <p className="text-[9px] text-gray-300 font-mono leading-none">{t.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{t.descricao}</p>
                      {t.fornecedor && <p className="text-xs text-gray-400">{t.fornecedor}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{t.categoria}</td>
                    <td className="py-3 px-4 text-gray-500">{t.obra?.nome || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        t.estado_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                        t.estado_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {t.estado_aprovacao === 'aprovado' && <CheckCircle className="w-3 h-3" />}
                        {t.estado_aprovacao === 'rejeitado' && <XCircle className="w-3 h-3" />}
                        {(!t.estado_aprovacao || t.estado_aprovacao === 'pendente') && <Clock className="w-3 h-3" />}
                        {t.estado_aprovacao === 'aprovado' ? 'Aprovado' : t.estado_aprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.lembrete ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600" title={`Lembrar ${t.lembrete_dias || 3} dias antes`}>
                          <Bell className="w-3 h-3" /> {t.lembrete_dias || 3}d
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300"><BellOff className="w-3 h-3 inline" /></span>
                      )}
                      {t.recorrente && <span className="text-xs text-blue-500 ml-1">↻</span>}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{'EUR ' + t.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEditTransacao(t)} className="p-1 rounded hover:bg-gray-200 text-blue-600">Editar</button>
                        <button onClick={() => handleDeleteTransacao(t.id)} className="p-1 rounded hover:bg-gray-200 text-red-600">X</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar' : 'Nova'} Transacao</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, tipo: 'receita', categoria: '' })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.tipo === 'receita' ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-200'}`}>Receita</button>
                <button type="button" onClick={() => setForm({ ...form, tipo: 'despesa', categoria: '' })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.tipo === 'despesa' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200'}`}>Despesa</button>
              </div>
              <div><label className="label">Descricao</label><input required className="input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Compra de cimento" /></div>
              <div><label className="label">Valor (EUR)</label><input type="number" step="0.01" required className="input" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="0.00" /></div>
              <div>
                <label className="label">Categoria</label>
                {categoriaCustom ? (
                  <div className="flex gap-2">
                    <input className="input flex-1" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Digite o nome da categoria" autoFocus />
                    <button type="button" onClick={() => { setCategoriaCustom(false); setForm({ ...form, categoria: '' }) }} className="text-xs text-gray-500 hover:text-gray-700">Voltar</button>
                  </div>
                ) : (
                  <select required className="input" value={form.categoria} onChange={e => {
                    if (e.target.value === '__custom__') {
                      setCategoriaCustom(true)
                      setForm({ ...form, categoria: '' })
                    } else {
                      setForm({ ...form, categoria: e.target.value })
                    }
                  }}>
                    <option value="">Selecionar...</option>
                    <option value="__custom__">✏️ Outro (digitar)...</option>
                    {(form.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
              <div><label className="label">Data</label><input type="date" required className="input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
              <div><label className="label">Obra (opcional)</label><select className="input" value={form.obra_id} onChange={e => setForm({ ...form, obra_id: e.target.value })}><option value="">Sem obra</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}</select></div>
              <div><label className="label">Fornecedor (opcional)</label><input className="input" value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} placeholder="Nome" /></div>

              {/* Alerta / Lembrete */}
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Alertas e Recorrência</h4>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.lembrete} onChange={e => setForm({ ...form, lembrete: e.target.checked })} className="rounded" />
                  <Bell className="w-4 h-4 text-amber-500" /> Alertar sobre este pagamento
                </label>
                {form.lembrete && (
                  <div>
                    <label className="label text-xs">Lembrar quantos dias antes?</label>
                    <input type="number" min={0} max={60} className="input" value={form.lembrete_dias} onChange={e => setForm({ ...form, lembrete_dias: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.recorrente} onChange={e => setForm({ ...form, recorrente: e.target.checked })} className="rounded" />
                  ↻ Recorrente (repetir todo mês)
                </label>
                {form.recorrente && (
                  <div>
                    <label className="label text-xs">Tipo de recorrência</label>
                    <select className="input" value={form.recorrente_tipo} onChange={e => setForm({ ...form, recorrente_tipo: e.target.value })}>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                )}
              </div>

              {editingId && (
                <div className="border-t pt-4">
                  <label className="label mb-2">Aprovação</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleAprovar(editingId, 'aprovado')} className="btn flex-1 bg-green-100 text-green-700 hover:bg-green-200 border-green-300"><CheckCircle className="w-4 h-4" /> Aprovar</button>
                    <button type="button" onClick={() => handleAprovar(editingId, 'rejeitado')} className="btn flex-1 bg-red-100 text-red-700 hover:bg-red-200 border-red-300"><XCircle className="w-4 h-4" /> Rejeitar</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setCategoriaCustom(false) }} className="btn flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">{editingId ? 'Atualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}