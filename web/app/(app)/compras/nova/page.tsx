// web/app/(app)/compras/nova/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Camera, Loader } from 'lucide-react'

// Obras carregadas via hook — simplificado aqui com fetch
import { useEffect } from 'react'
import type { Obra } from '@/types/database'

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])
  const [form, setForm] = useState({
    obra_id: '', titulo: '', descricao: '',
    quantidade: '', unidade: '',
    valor_estimado: '', iva_autoliquidacao: true,
  })

  useEffect(() => {
    (supabase as any).from('obras').select('id,nome').eq('estado','ativa')
      .then(({ data }: any) => setObras(data ?? []))
  }, [])

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFotos(Array.from(e.target.files))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.obra_id || !form.titulo) { toast.error('Preencha os campos obrigatórios'); return }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Upload de fotos da obra
      const fotosUrls: string[] = []
      for (const foto of fotos) {
        const path = `${form.obra_id}/${Date.now()}_${foto.name}`
        const { error } = await supabase.storage.from('fotos-obra').upload(path, foto)
        if (!error) {
          const { data } = supabase.storage.from('fotos-obra').getPublicUrl(path)
          fotosUrls.push(data.publicUrl)
        }
      }

      const { data, error } = await (supabase as any).from('requisicoes').insert({
        obra_id: form.obra_id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
        unidade: form.unidade || null,
        valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
        iva_autoliquidacao: form.iva_autoliquidacao,
        estado: 'aguarda_aprovacao_financeiro',
        fotos: fotosUrls.length > 0 ? fotosUrls : null,
        criado_por: user.id,
      }).select()

      console.log('Insert result:', data, 'Error:', error)
      
      if (error) {
        console.error('Insert error:', error)
        throw new Error(error.message)
      }
      toast.success('Requisição criada com sucesso!')
      router.push('/compras')
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao criar requisição')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova requisição de material</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preencha os detalhes do material necessário na obra</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold">Informação básica</h2>

          <div>
            <label className="label">Estaleiro *</label>
            <select className="input" value={form.obra_id} onChange={set('obra_id')} required>
              <option value="">Selecionar obra...</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Título do material *</label>
            <input className="input" value={form.titulo} onChange={set('titulo')}
              placeholder="Ex: Aço estrutural A500" required />
          </div>

          <div>
            <label className="label">Descrição / especificação técnica</label>
            <textarea className="input min-h-[80px]" value={form.descricao} onChange={set('descricao')}
              placeholder="Especificações técnicas, normas, etc." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade</label>
              <input type="number" step="0.001" className="input" value={form.quantidade} onChange={set('quantidade')}
                placeholder="12" />
            </div>
            <div>
              <label className="label">Unidade</label>
              <input className="input" value={form.unidade} onChange={set('unidade')}
                placeholder="ton, m³, un, kg..." />
            </div>
          </div>

          <div>
            <label className="label">Valor estimado (€)</label>
            <input type="number" step="0.01" className="input" value={form.valor_estimado} onChange={set('valor_estimado')}
              placeholder="24800.00" />
            <p className="text-xs text-gray-400 mt-1">
              Até €5.000 = aprovação direta · €5k–€50k = financeiro · acima = diretoria
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="iva" checked={form.iva_autoliquidacao}
              onChange={e => setForm(f => ({ ...f, iva_autoliquidacao: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <label htmlFor="iva" className="text-sm text-gray-700 cursor-pointer">
              IVA Autoliquidação (inversão do sujeito passivo — construção civil Portugal)
            </label>
          </div>
        </div>

        {/* Fotos da obra */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3">Fotos da obra (opcional)</h2>
          <p className="text-xs text-gray-500 mb-3">
            Fotografe o local onde o material será aplicado ou o estado atual da obra.
          </p>
          <label className="flex items-center gap-2 btn cursor-pointer w-fit">
            <Camera className="w-4 h-4" />
            <span>Adicionar fotos</span>
            <input type="file" accept="image/*" multiple onChange={handleFotos} className="hidden" />
          </label>
          {fotos.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {fotos.map((f, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn flex-1 justify-center">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'A criar...' : 'Criar requisição'}
          </button>
        </div>
      </form>
    </div>
  )
}
