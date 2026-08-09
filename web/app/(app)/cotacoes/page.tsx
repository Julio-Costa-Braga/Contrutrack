// web/app/(app)/cotacoes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, FileText, Globe, Calculator, Upload, TrendingUp, Download, Eye, Trash2 } from 'lucide-react'

interface Cotacao {
  id: string
  cliente: string
  descricao: string
  documento_url?: string
  pais_base: string
  moeda: string
  valor_base: number
  valores_pais: Record<string, number>
  lucro_estimado: number
  custo_mao_obra: number
  custo_material: number
  created_at: string
}

const PAISES = [
  { code: 'PT', name: 'Portugal', currency: 'EUR', symbol: '€' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', symbol: 'R$' },
  { code: 'ES', name: 'Espanha', currency: 'EUR', symbol: '€' },
  { code: 'FR', name: 'França', currency: 'EUR', symbol: '€' },
  { code: 'DE', name: 'Alemanha', currency: 'EUR', symbol: '€' },
  { code: 'IT', name: 'Itália', currency: 'EUR', symbol: '€' },
  { code: 'NL', name: 'Holanda', currency: 'EUR', symbol: '€' },
  { code: 'BE', name: 'Bélgica', currency: 'EUR', symbol: '€' },
  { code: 'UK', name: 'Reino Unido', currency: 'GBP', symbol: '£' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canadá', currency: 'CAD', symbol: 'C$' },
  { code: 'AU', name: 'Austrália', currency: 'AUD', symbol: 'A$' },
  { code: 'JP', name: 'Japão', currency: 'JPY', symbol: '¥' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥' },
  { code: 'IN', name: 'Índia', currency: 'INR', symbol: '₹' },
  { code: 'ZA', name: 'África do Sul', currency: 'ZAR', symbol: 'R' },
  { code: 'AO', name: 'Angola', currency: 'AOA', symbol: 'Kz' },
  { code: 'MZ', name: 'Moçambique', currency: 'MZN', symbol: 'MT' },
  { code: 'CV', name: 'Cabo Verde', currency: 'CVE', symbol: '$' },
  { code: 'ST', name: 'São Tomé Príncipe', currency: 'STN', symbol: 'Db' },
  { code: 'GW', name: 'Guiné-Bissau', currency: 'XOF', symbol: 'CFA' },
  { code: 'CH', name: 'Suíça', currency: 'CHF', symbol: 'Fr' },
  { code: 'SE', name: 'Suécia', currency: 'SEK', symbol: 'kr' },
  { code: 'NO', name: 'Noruega', currency: 'NOK', symbol: 'kr' },
  { code: 'PL', name: 'Polónia', currency: 'PLN', symbol: 'zł' },
  { code: 'IE', name: 'Irlanda', currency: 'EUR', symbol: '€' },
]

const MOEDAS_DISPONIVEIS = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'CAD', name: 'Dólar Canadiano', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'Fr' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥' },
  { code: 'INR', name: 'Rúpia Indiana', symbol: '₹' },
  { code: 'AOA', name: 'Kwanza Angolano', symbol: 'Kz' },
  { code: 'MZN', name: 'Metical Moçambicano', symbol: 'MT' },
  { code: 'CVE', name: 'Escudo Cabo Verde', symbol: '$' },
  { code: 'ZAR', name: 'Rand Sul-Africano', symbol: 'R' },
  { code: 'SEK', name: 'Coroa Sueca', symbol: 'kr' },
  { code: 'NOK', name: 'Coroa Norueguesa', symbol: 'kr' },
  { code: 'PLN', name: 'Złoty Polaco', symbol: 'zł' },
]

const TAXAS_MAO_OBRA: Record<string, number> = {
  PT: 15, BR: 8, ES: 14, FR: 18, DE: 20, IT: 16, NL: 18, BE: 17, UK: 22, US: 25, 
  CA: 24, AU: 26, JP: 28, CN: 12, IN: 6, ZA: 10, AO: 5, MZ: 4, CV: 6, ST: 5, GW: 4, CH: 30, SE: 22, NO: 24, PL: 10, IE: 18
}

const TAXAS_MATERIAL: Record<string, number> = {
  PT: 1.0, BR: 0.7, ES: 1.0, FR: 1.1, DE: 1.2, IT: 1.1, NL: 1.1, BE: 1.1, UK: 1.3, US: 1.2, 
  CA: 1.15, AU: 1.25, JP: 1.3, CN: 0.6, IN: 0.5, ZA: 0.8, AO: 0.5, MZ: 0.4, CV: 0.7, ST: 0.6, GW: 0.5, CH: 1.4, SE: 1.2, NO: 1.3, PL: 0.9, IE: 1.05
}

export default function CotacoesPage() {
  const supabase = createClient()
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    cliente: '',
    descricao: '',
    pais_base: 'PT',
    moeda: 'EUR',
    valor_base: '',
    custo_material: '',
    custo_mao_obra: '',
    documento: null as File | null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await (supabase as any).from('cotacoes').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    setCotacoes(data ?? [])
    setLoading(false)
  }

  async function handleDeleteCotacao(id: string) {
    if (!confirm('Mover para a lixeira?')) return
    const { error } = await supabase.from('cotacoes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Movido para lixeira!'); loadData() }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const valorBase = parseFloat(form.valor_base)
    const custoMaterial = parseFloat(form.custo_material)
    const custoMaoObra = parseFloat(form.custo_mao_obra)
    
    const taxaMaodeObra = TAXAS_MAO_OBRA[form.pais_base] || 15
    const taxaMaterial = TAXAS_MATERIAL[form.pais_base] || 1
    
    const custoTotal = (custoMaterial * taxaMaterial) + (custoMaoObra * (taxaMaodeObra / 100) * valorBase)
    const lucro = valorBase - custoTotal
    const lucroPercent = (lucro / valorBase) * 100

    const valoresPais: Record<string, number> = {}
    PAISES.forEach(pais => {
      const taxaMo = TAXAS_MAO_OBRA[pais.code] || 15
      const taxaMat = TAXAS_MATERIAL[pais.code] || 1
      const custoNessesPais = (custoMaterial * taxaMat) + (custoMaoObra * (taxaMo / 100) * valorBase)
      valoresPais[pais.code] = custoNessesPais
    })

    let documentoUrl = ''
    if (form.documento) {
      const path = `cotacoes/${Date.now()}_${form.documento.name}`
      const { error: uploadError } = await supabase.storage.from('documentos').upload(path, form.documento)
      if (!uploadError) {
        documentoUrl = path
      }
    }

    const { error } = await (supabase as any).from('cotacoes').insert({
      fornecedor: form.cliente,
      preco_total: valorBase,
      cliente: form.cliente,
      descricao: form.descricao,
      pais_base: form.pais_base,
      moeda: form.moeda,
      valor_base: valorBase,
      valores_pais: valoresPais,
      documento_url: documentoUrl || null,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Cotação criada!')
      setShowModal(false)
      setForm({
        cliente: '',
        descricao: '',
        pais_base: 'PT',
        moeda: 'EUR',
        valor_base: '',
        custo_material: '',
        custo_mao_obra: '',
        documento: null,
      })
      loadData()
    }
  }

  function getPaisInfo(code: string) {
    return PAISES.find(p => p.code === code) || PAISES[0]
  }

  if (loading) return <div>A carregar...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Cotações & Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compare valores por país e calcule margens</p>
        </div>
        <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200">
          <Trash2 className="w-4 h-4" /> Lixeira
        </Link>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Nova Cotação
        </button>
      </div>

      {cotacoes.length === 0 ? (
        <div className="card">
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma cotação criada ainda</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cotacoes.map(c => {
            const paisBase = getPaisInfo(c.pais_base)
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{c.cliente}</h3>
                  <span className="pill pill-green">{paisBase.code}</span>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">{c.descricao}</p>
                
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">Valor base:</span>
                  <span className="font-semibold">{paisBase.symbol}{c.valor_base.toLocaleString('pt-PT')}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">Lucro estimado:</span>
                  <span className={`font-semibold ${c.lucro_estimado >= 20 ? 'text-green-600' : c.lucro_estimado >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                    {c.lucro_estimado.toFixed(1)}%
                  </span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-400 mb-2">Comparativo por país:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(c.valores_pais || {}).slice(0, 5).map(([code, valor]) => {
                      const pais = getPaisInfo(code)
                      return (
                        <span key={code} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded">
                          {code}: {pais.symbol}{valor.toFixed(0)}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {c.documento_url && (
                    <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos/${c.documento_url}`} 
                       target="_blank" className="btn flex-1 text-xs">
                      <FileText className="w-3 h-3" /> Ver Documento
                    </a>
                  )}
                  <button onClick={() => handleDeleteCotacao(c.id)} className="p-1.5 rounded hover:bg-red-100 text-red-600" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nova Cotação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8 mx-4">
            <h2 className="text-lg font-semibold mb-4">Nova Cotação / Orçamento</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Cliente *</label>
                  <input
                    required
                    className="input"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="label">País Base</label>
                  <select
                    className="input"
                    value={form.pais_base}
                    onChange={e => setForm({ ...form, pais_base: e.target.value })}
                  >
                    {PAISES.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Moeda</label>
                  <select
                    className="input"
                    value={form.moeda}
                    onChange={e => setForm({ ...form, moeda: e.target.value })}
                  >
                    {MOEDAS_DISPONIVEIS.map(m => (
                      <option key={m.code} value={m.code}>{m.name} ({m.symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Descrição do projeto *</label>
                  <textarea
                    required
                    className="input"
                    rows={2}
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Ex: Construção de moradia T3..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Valor Orçado ({MOEDAS_DISPONIVEIS.find(m => m.code === form.moeda)?.symbol || '€'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    value={form.valor_base}
                    onChange={e => setForm({ ...form, valor_base: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="label">Custo Material ({MOEDAS_DISPONIVEIS.find(m => m.code === form.moeda)?.symbol || '€'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    value={form.custo_material}
                    onChange={e => setForm({ ...form, custo_material: e.target.value })}
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="label">Horas Mão de Obra *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    className="input"
                    value={form.custo_mao_obra}
                    onChange={e => setForm({ ...form, custo_mao_obra: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="label">Anexar Proposta (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  className="input"
                  onChange={e => setForm({ ...form, documento: e.target.files?.[0] || null })}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <p className="font-medium mb-1">ℹ️ Como funciona:</p>
                <p>Após inserir os valores, o sistema irá calcular automaticamente:</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>Custo estimado em cada país</li>
                  <li>Margem de lucro baseada na mão de obra local</li>
                  <li>Comparativo de mercado</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Calcular & Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}