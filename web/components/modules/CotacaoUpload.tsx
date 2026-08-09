// web/components/modules/CotacaoUpload.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { requisicaoId: string }

export default function CotacaoUpload({ requisicaoId }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fornecedor: '', preco_total: '', preco_unitario: '',
    prazo_entrega: '', validade_dias: '',
  })
  const [pdf, setPdf] = useState<File | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fornecedor) { toast.error('Insira o nome do fornecedor'); return }
    setLoading(true)

    try {
      let pdf_url = null
      if (pdf) {
        const path = `cotacoes/${requisicaoId}/${Date.now()}_${pdf.name}`
        const { error } = await supabase.storage.from('fotos-obra').upload(path, pdf)
        if (!error) {
          const { data } = supabase.storage.from('fotos-obra').getPublicUrl(path)
          pdf_url = data.publicUrl
        }
      }

      const { error } = await supabase.from('cotacoes').insert({
        requisicao_id: requisicaoId,
        fornecedor: form.fornecedor,
        preco_total: form.preco_total ? parseFloat(form.preco_total) : null,
        preco_unitario: form.preco_unitario ? parseFloat(form.preco_unitario) : null,
        prazo_entrega: form.prazo_entrega || null,
        validade_dias: form.validade_dias ? parseInt(form.validade_dias) : null,
        pdf_url,
        ocr_processado: false,
      })

      if (error) throw error
      toast.success('Cotação adicionada!')
      setForm({ fornecedor:'', preco_total:'', preco_unitario:'', prazo_entrega:'', validade_dias:'' })
      setPdf(null)
      // Recarregar
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao adicionar cotação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Adicionar cotação de fornecedor
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Anexe o PDF do fornecedor (o sistema extrai os preços via OCR) ou preencha manualmente.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Fornecedor *</label>
          <input className="input" value={form.fornecedor} onChange={set('fornecedor')}
            placeholder="Metalfer Lda." required />
        </div>

        <div>
          <label className="label">Preço total (€)</label>
          <input type="number" step="0.01" className="input" value={form.preco_total} onChange={set('preco_total')}
            placeholder="21840.00" />
        </div>
        <div>
          <label className="label">Preço unitário (€)</label>
          <input type="number" step="0.0001" className="input" value={form.preco_unitario} onChange={set('preco_unitario')}
            placeholder="1820.00" />
        </div>

        <div>
          <label className="label">Prazo de entrega</label>
          <input className="input" value={form.prazo_entrega} onChange={set('prazo_entrega')}
            placeholder="5 dias úteis" />
        </div>
        <div>
          <label className="label">Validade da proposta (dias)</label>
          <input type="number" className="input" value={form.validade_dias} onChange={set('validade_dias')}
            placeholder="30" />
        </div>

        <div className="col-span-2">
          <label className="label">PDF da proposta (opcional)</label>
          <label className="flex items-center gap-2 btn cursor-pointer w-fit">
            <Upload className="w-4 h-4" />
            <span>{pdf ? pdf.name : 'Anexar PDF'}</span>
            <input type="file" accept=".pdf" onChange={e => setPdf(e.target.files?.[0] ?? null)} className="hidden" />
          </label>
        </div>

        <div className="col-span-2 flex gap-2">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'A guardar...' : 'Adicionar cotação'}
          </button>
        </div>
      </form>
    </div>
  )
}
