'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { AlertTriangle, TrendingUp, Users, Building2, ShoppingCart, Loader } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [obras, setObras] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [requisicoes, setRequisicoes] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [o, f, a, r] = await Promise.all([
      supabase.from('obras').select('*').eq('estado', 'ativa'),
      supabase.from('funcionarios').select('*').eq('ativo', true),
      supabase.from('alertas').select('*').eq('lido', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('requisicoes').select('*, obras(nome)').in('estado', ['aguarda_aprovacao_financeiro', 'aguarda_cotacao']).order('created_at', { ascending: false })
    ])
    setObras(o.data || [])
    setFuncionarios(f.data || [])
    setAlertas(a.data || [])
    setRequisicoes(r.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const custoTotal = obras.reduce((s, o) => s + (o.custo_real || 0), 0)
  const orcamentoTotal = obras.reduce((s, o) => s + (o.orcamento_total || 0), 0)

  const chartData = obras.map((o, i) => ({
    nome: o.nome.length > 15 ? o.nome.substring(0, 15) + '...' : o.nome,
    orcamento: o.orcamento_total || 0,
    gasto: o.custo_real || 0,
    cor: COLORS[i % COLORS.length]
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button onClick={loadData} className="btn" disabled={loading}>
          <Loader className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Building2 className="w-4 h-4" /> Obras ativas
          </div>
          <p className="text-2xl font-semibold">{obras.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" /> Funcionários
          </div>
          <p className="text-2xl font-semibold">{funcionarios.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <ShoppingCart className="w-4 h-4" /> Aguardam aprovação
          </div>
          <p className="text-2xl font-semibold">{requisicoes.length}</p>
          {requisicoes.length > 0 && (
            <Link href="/financeiro/aprovacoes" className="text-xs text-blue-600 hover:underline">
              Ver aprovações
            </Link>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" /> Custos
          </div>
          <p className="text-2xl font-semibold">€{custoTotal.toLocaleString('pt-PT')}</p>
          <p className="text-xs text-gray-500">Orçamento: €{orcamentoTotal.toLocaleString('pt-PT')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custos por Obra */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Custos por Obra
          </h2>
          {chartData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {/* Resumo geral */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Total Orçamento</p>
                    <p className="text-lg font-bold text-blue-600">€{orcamentoTotal.toLocaleString('pt-PT')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Gasto</p>
                    <p className="text-lg font-bold text-green-600">€{custoTotal.toLocaleString('pt-PT')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Diferença</p>
                    <p className={`text-lg font-bold ${orcamentoTotal - custoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{(orcamentoTotal - custoTotal).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Lista de obras */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500 text-xs">
                      <th className="text-left py-2">Obra</th>
                      <th className="text-right py-2">Orçamento</th>
                      <th className="text-right py-2">Gasto</th>
                      <th className="text-right py-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((o: any, i: number) => {
                      const percent = o.orcamento > 0 ? ((o.gasto / o.orcamento) * 100) : 0
                      const percentDisplay = percent.toFixed(0)
                      const colorClass = percent >= 100 ? 'bg-red-100 text-red-700' :
                        percent >= 90 ? 'bg-orange-100 text-orange-700' :
                        percent >= 75 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      const valorColor = percent >= 100 ? 'text-red-600' : percent >= 90 ? 'text-orange-600' : 'text-green-600'
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.cor }}></span>
                              <span className="font-medium truncate max-w-[150px]">{o.nome}</span>
                            </div>
                          </td>
                          <td className="py-2 text-right text-blue-600 font-medium">€{(o.orcamento || 0).toLocaleString('pt-PT')}</td>
                          <td className={`py-2 text-right font-medium ${valorColor}`}>
                            €{(o.gasto || 0).toLocaleString('pt-PT')}
                          </td>
                          <td className="py-2 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                              {percentDisplay}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Legenda */}
              <div className="flex gap-4 mt-3 text-xs text-gray-500 pt-2 border-t">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500" /> Orçamento
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500" /> Gasto
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500" /> Acima do orçamento
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas
          </h2>
          {alertas.length === 0 ? (
            <p className="text-gray-400 text-sm">Sem alertas</p>
          ) : (
            <div className="space-y-2">
              {alertas.map(a => (
                <div key={a.id} className="text-sm flex items-center justify-between p-2 bg-amber-50 rounded">
                  <span>{a.titulo}</span>
                  <span className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString('pt-PT')}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/alertas" className="text-xs text-blue-600 mt-2 block">Ver todos os alertas</Link>
        </div>
      </div>
    </div>
  )
}