'use client'

// web/app/(app)/compras/[id]/page.tsx
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CotacaoUpload from '@/components/modules/CotacaoUpload'

export default function RequisicaoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [req, setReq] = useState<any>(null)
  const [cotacoes, setCotacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: r } = await supabase.from('requisicoes').select('*, obras(nome), perfis(nome_completo)').eq('id', params.id).single()
      if (!r) { notFound(); return }
      setReq(r)
      
      const { data: c } = await supabase.from('cotacoes').select('*').eq('requisicao_id', params.id).order('preco_total')
      setCotacoes(c || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return <div>A carregar...</div>

  const melhorCotacao = cotacoes.find(c => c.selecionada) ?? cotacoes[0]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/compras" className="hover:underline">Compras</Link>
          <span>/</span>
          <span>{req.titulo}</span>
        </div>
        <h1 className="text-xl font-semibold">{req.titulo}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`pill ${
            req.estado === 'aprovado' ? 'pill-green' :
            req.estado === 'rejeitado' ? 'pill-red' :
            req.estado === 'rascunho' ? 'pill-gray' : 'pill-amber'
          }`}>{req.estado.replace(/_/g,' ')}</span>
          {req.iva_autoliquidacao && (
            <span className="pill" style={{background:'#fef3e2',color:'#a05c00'}}>IVA Autoliquidação</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Obra</p>
          <p className="font-semibold text-sm">{(req as any).obras?.nome}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Valor estimado</p>
          <p className="font-semibold text-sm">
            {req.valor_estimado ? `€${req.valor_estimado.toLocaleString('pt-PT')}` : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Quantidade</p>
          <p className="font-semibold text-sm">
            {req.quantidade ? `${req.quantidade} ${req.unidade ?? ''}` : '—'}
          </p>
        </div>
      </div>

      {/* Tabela comparativa de cotações */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Tabela comparativa de cotações</h2>
          {cotacoes && cotacoes.length > 0 && (
            <span className="pill pill-blue">{cotacoes.length} cotações · OCR extraído</span>
          )}
        </div>

        {cotacoes && cotacoes.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                {['Fornecedor','Preço unit.','Total','Prazo entrega','Validade','',''].map((h,i) => (
                  <th key={i} className="text-left pb-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotacoes.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-100 last:border-0 ${i === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-2.5 font-medium">{c.fornecedor}</td>
                  <td className="py-2.5">
                    {c.preco_unitario ? `€${c.preco_unitario.toLocaleString('pt-PT')}` : '—'}
                  </td>
                  <td className={`py-2.5 font-semibold ${i === 0 ? 'text-green-700' : ''}`}>
                    {c.preco_total ? `€${c.preco_total.toLocaleString('pt-PT')}` : '—'}
                    {i === 0 && <span className="ml-1.5 pill pill-green text-[10px]">Melhor preço</span>}
                  </td>
                  <td className="py-2.5 text-gray-600">{c.prazo_entrega ?? '—'}</td>
                  <td className="py-2.5 text-gray-500">{c.validade_dias ? `${c.validade_dias} dias` : '—'}</td>
                  <td className="py-2.5">
                    {c.pdf_url && <a href={c.pdf_url} target="_blank" className="text-blue-600 underline">PDF</a>}
                  </td>
                  <td className="py-2.5">
                    {i === 0 && !req.aprovado_por && (
                      <button 
                        className="btn text-xs py-1 px-2"
                        onClick={async () => {
                          await fetch('/api/cotacoes/selecionar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cotacaoId: c.id, requisicaoId: params.id })
                          })
                          window.location.reload()
                        }}
                      >
                        Selecionar
                      </button>
                    )}
                    {c.selecionada && <span className="pill pill-green">✓ Selecionada</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">Sem cotações. Adicione PDFs de fornecedores abaixo.</p>
        )}
      </div>

      {/* Upload de cotação */}
      <CotacaoUpload requisicaoId={params.id} />
    </div>
  )
}
