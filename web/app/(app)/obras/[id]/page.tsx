'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader, Trash2, ArrowLeft, MapPin, Calendar, Edit2, Save } from 'lucide-react'

export default function ObraPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [obra, setObra] = useState<any>(null)
  const [equipe, setEquipe] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadObra()
  }, [params.id])

  async function loadObra() {
    const [obraRes, equipeRes] = await Promise.all([
      supabase.from('obras').select('*').eq('id', params.id).single(),
      supabase
        .from('funcionario_obras')
        .select('*, funcionarios(id, nome_completo, cargo, setor)')
        .eq('obra_id', params.id)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false })
    ])

    if (obraRes.error || !obraRes.data) {
      toast.error('Obra não encontrada')
      router.push('/obras')
    } else {
      setObra(obraRes.data)
      setForm(obraRes.data)
    }

    if (equipeRes.data) {
      setEquipe(equipeRes.data)
    }

    if (equipeRes.error) {
      console.error('Erro ao carregar equipe da obra:', equipeRes.error)
    }

    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('obras')
      .update({
        nome: form.nome,
        descricao: form.descricao,
        morada: form.morada,
        cidade: form.cidade,
        estado: form.estado,
        pais: form.pais,
        rua: form.rua,
        numero: form.numero,
        codigo_postal: form.codigo_postal,
        data_inicio: form.data_inicio || null,
        data_fim_prev: form.data_fim_prev || null,
        orcamento_total: form.orcamento_total ? parseFloat(form.orcamento_total) : null,
      })
      .eq('id', params.id)
    
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Obra atualizada!')
      setEditMode(false)
      loadObra()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Mover esta obra para a lixeira? Os dados permanecem por 5 dias.')) return
    
    const { error } = await supabase.from('obras').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
    
    if (error) toast.error(error.message)
    else {
      toast.success('Obra movida para lixeira')
      router.push('/obras')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!obra) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/obras" className="btn p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {editMode ? (
            <input
              className="input text-xl font-semibold"
              value={form.nome || ''}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
          ) : (
            <div>
              <h1 className="text-xl font-semibold">{obra.nome}</h1>
              <p className="text-sm text-gray-500">{obra.descricao || 'Sem descrição'}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditMode(false); setForm(obra) }} className="btn">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} className="btn">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => setShowModal(true)} className="btn btn-danger">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {editMode ? (
        <div className="card space-y-4">
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input"
              value={form.descricao || ''}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rua</label>
              <input className="input" value={form.rua || ''} onChange={e => setForm({ ...form, rua: e.target.value })} />
            </div>
            <div>
              <label className="label">Número</label>
              <input className="input" value={form.numero || ''} onChange={e => setForm({ ...form, numero: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={form.cidade || ''} onChange={e => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <label className="label">Código Postal</label>
              <input className="input" value={form.codigo_postal || ''} onChange={e => setForm({ ...form, codigo_postal: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data Início</label>
              <input type="date" className="input" value={form.data_inicio?.split('T')[0] || ''} onChange={e => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <label className="label">Data Fim Previsto</label>
              <input type="date" className="input" value={form.data_fim_prev?.split('T')[0] || ''} onChange={e => setForm({ ...form, data_fim_prev: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado || 'em_preparacao'} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="em_preparacao">Em Preparação</option>
                <option value="ativa">Ativa</option>
                <option value="suspensa">Suspensa</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            <div>
              <label className="label">Orçamento (€)</label>
              <input type="number" className="input" value={form.orcamento_total || ''} onChange={e => setForm({ ...form, orcamento_total: e.target.value })} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <MapPin className="w-4 h-4" /> Localização
            </div>
            <p className="font-medium">{obra.rua} {obra.numero}, {obra.codigo_postal}</p>
            <p className="text-sm text-gray-500">{obra.cidade}{obra.distrito ? `, ${obra.distrito}` : ''}{obra.pais ? `, ${obra.pais}` : ''}</p>
            {obra.latitude && obra.longitude && (
              <p className="text-xs text-gray-400 mt-1">GPS: {obra.latitude}, {obra.longitude}</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="w-4 h-4" /> Datas
            </div>
            <p className="text-sm">Início: {obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-PT') : '—'}</p>
            <p className="text-sm">Fim previsto: {obra.data_fim_prev ? new Date(obra.data_fim_prev).toLocaleDateString('pt-PT') : '—'}</p>
          </div>

          <div className="card">
            <div className="text-gray-500 mb-2">Orçamento</div>
            <p className="text-2xl font-semibold">€{obra.orcamento_total?.toLocaleString('pt-PT') || '0'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Equipe da Obra</h2>
            <p className="text-sm text-gray-500">{equipe.length} colaboradores ativos</p>
          </div>
        </div>

        {equipe.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum colaborador associado a esta obra.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Cargo</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Setor</th>
                </tr>
              </thead>
              <tbody>
                {equipe.map(item => (
                  <tr key={item.funcionario_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.funcionarios?.nome_completo || '—'}</td>
                    <td className="py-3 px-4">{item.funcionarios?.cargo || '—'}</td>
                    <td className="py-3 px-4">{item.funcionarios?.setor || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Confirmar eliminação</h2>
            <p className="text-sm text-gray-500 mb-4">Tens a certeza que queres eliminar "{obra.nome}"?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="btn flex-1">Cancelar</button>
              <button onClick={handleDelete} className="btn btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}