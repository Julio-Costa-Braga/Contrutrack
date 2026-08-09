'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { DollarSign, Check, X, Loader, Building2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FinanceiroAprovacoesPage() {
  const supabase = createClient()
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [obraId, setObraId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [r, o] = await Promise.all([
      supabase.from('requisicoes').select('id,titulo,valor_estimado,estado,obra_id,created_at').eq('estado', 'aguarda_aprovacao_financeiro').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('obras').select('id,nome').eq('estado', 'ativa')
    ])
    setRequisicoes(r.data || [])
    setObras(o.data || [])
    setLoading(false)
  }

  async function handleAprovar(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const req = requisicoes.find(r => r.id === id)
    if (!req) return
    
    const { error } = await supabase.from('requisicoes').update({ 
      estado: 'aprovado', 
      aprovado_por: user.id, 
      aprovado_em: new Date().toISOString() 
    }).eq('id', id)
    
    if (!error && req.obra_id && req.valor_estimado) {
      const { data: obra } = await supabase.from('obras').select('custo_real').eq('id', req.obra_id).single()
      if (obra) {
        await supabase.from('obras').update({ 
          custo_real: (obra.custo_real || 0) + req.valor_estimado 
        }).eq('id', req.obra_id)
        
        await supabase.from('transacoes').insert({
          descricao: `Aprovação: ${req.titulo}`,
          valor: req.valor_estimado,
          tipo: 'despesa',
          categoria: 'Materiais',
          data: new Date().toISOString().split('T')[0],
          obra_id: req.obra_id,
        })
      }
    }
    
    toast.success('Aprovado!')
    loadData()
  }

  async function handleRejeitar(id: string, motivo: string) {
    await supabase.from('requisicoes').update({ 
      estado: 'rejeitado', 
      motivo_rejeicao: motivo 
    }).eq('id', id)
    
    toast.success('Rejeitado')
    loadData()
  }

  function getObraNome(obraId: string) {
    const obra = obras.find(o => o.id === obraId)
    return obra?.nome || '—'
  }

  const filtered = obraId ? requisicoes.filter(r => r.obra_id === obraId) : requisicoes
  const totalPendente = filtered.reduce((s, r) => s + (r.valor_estimado || 0), 0)
  
  const porObra = obras
    .map(o => ({
      obra: o,
      total: requisicoes.filter(r => r.obra_id === o.id).reduce((s, r) => s + (r.valor_estimado || 0), 0),
      count: requisicoes.filter(r => r.obra_id === o.id).length
    }))
    .filter(o => o.count > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Aprovações Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">{requisicoes.length} requisições pendentes</p>
        </div>
        <button onClick={loadData} disabled={loading} className="btn">
          <Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
        <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200">
          <Trash2 className="w-4 h-4" /> Lixeira
        </Link>
      </div>

      {/* Resumo por obra */}
      {porObra.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Gastos por Obra
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {porObra.map(o => (
              <div key={o.obra.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 truncate">{o.obra.nome}</p>
                <p className="text-lg font-semibold">€{o.total.toLocaleString('pt-PT')}</p>
                <p className="text-xs text-gray-400">{o.count} requisições</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro por obra */}
      <div className="mb-4">
        <select 
          className="input w-64" 
          value={obraId} 
          onChange={e => setObraId(e.target.value)}
        >
          <option value="">Todas as obras</option>
          {obras.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>

      {/* Total pendente */}
      <div className="card mb-4 bg-amber-50 border-amber-200">
        <div className="flex items-center gap-2 text-amber-800">
          <DollarSign className="w-5 h-5" />
          <span className="font-semibold">Total pendente: €{totalPendente.toLocaleString('pt-PT')}</span>
        </div>
      </div>

      {/* Lista de requisições */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-4">Requisições pendentes</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Sem requisições pendentes</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-2 text-gray-500">Obra</th>
                <th className="text-left pb-2 text-gray-500">Título</th>
                <th className="text-right pb-2 text-gray-500">Valor</th>
                <th className="text-right pb-2 text-gray-500">Data</th>
                <th className="text-right pb-2 text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3">{getObraNome(r.obra_id)}</td>
                  <td className="py-3">{r.titulo}</td>
                  <td className="py-3 text-right font-medium">€{r.valor_estimado?.toLocaleString('pt-PT') || '—'}</td>
                  <td className="py-3 text-right text-gray-500">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-PT') : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button 
                        onClick={() => handleAprovar(r.id)}
                        className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                        title="Aprovar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const motivo = window.prompt('Motivo da rejeição:')
                          if (motivo) handleRejeitar(r.id, motivo)
                        }}
                        className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        title="Rejeitar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}