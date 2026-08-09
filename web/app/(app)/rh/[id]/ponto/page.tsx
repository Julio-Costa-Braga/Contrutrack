// web/app/(app)/rh/[id]/ponto/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Trash2, ArrowLeft, Edit2, X, Save, Plus, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FuncionarioPontoPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [funcionario, setFuncionario] = useState<any>(null)
  const [pontos, setPontos] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mesAtual, setMesAtual] = useState(new Date())
  const [view, setView] = useState<'diario'|'mensal'>('diario')
  
  const [editPonto, setEditPonto] = useState<any>(null)
  const [editForm, setEditForm] = useState({ tipo: '', localizacao_endereco: '', localizacao_lat: '', localizacao_lon: '' })
  const [editObraId, setEditObraId] = useState('')
  const [editDataHora, setEditDataHora] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    tipo: 'entrada',
    obra_id: '',
    data_hora: '',
    localizacao_endereco: ''
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadData() }, [id, mesAtual])

  async function loadData() {
    setLoading(true)
    try {
      const { data: f } = await supabase.from('funcionarios').select('*').eq('id', id).single()
      if (f) setFuncionario(f)

      const { data: obrasData } = await supabase
        .from('obras')
        .select('id, nome, rua, numero, codigo_postal, estado')
        .order('nome')
      setObras(obrasData || [])

      const inicio = startOfMonth(mesAtual)
      const fim = endOfMonth(mesAtual)

      const { data: p } = await supabase
        .from('registos_ponto')
        .select(`*, obras(nome, rua, numero, codigo_postal)`)
        .eq('funcionario_id', id)
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true })

      setPontos(p || [])
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  async function handleDelete(pontoId: string) {
    if (!confirm('Eliminar este registo de ponto?')) return
    const { error } = await supabase.from('registos_ponto').delete().eq('id', pontoId)
    if (error) toast.error(error.message)
    else { toast.success('Registo eliminado'); loadData() }
  }

  function handleEditOpen(p: any) {
    setEditPonto(p)
    const dt = new Date(p.data_hora)
    setEditForm({
      tipo: p.tipo || '',
      localizacao_endereco: p.localizacao_endereco || '',
      localizacao_lat: p.localizacao_lat?.toString() || '',
      localizacao_lon: p.localizacao_lon?.toString() || ''
    })
    setEditObraId(p.obra_id || '')
    setEditDataHora(format(dt, "yyyy-MM-dd'T'HH:mm"))
  }

  async function handleEditSave() {
    if (!editPonto) return
    setSaving(true)
    
    const updateData: any = { 
      tipo: editForm.tipo,
      data_hora: new Date(editDataHora).toISOString(),
      obra_id: editObraId || null
    }
    
    if (editForm.localizacao_endereco) {
      updateData.localizacao_endereco = editForm.localizacao_endereco
    }
    if (editForm.localizacao_lat && editForm.localizacao_lon) {
      updateData.localizacao_lat = parseFloat(editForm.localizacao_lat)
      updateData.localizacao_lon = parseFloat(editForm.localizacao_lon)
    }
    
    const { error } = await supabase
      .from('registos_ponto')
      .update(updateData)
      .eq('id', editPonto.id)
    
    setSaving(false)
    
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Registo atualizado!')
      setEditPonto(null)
      loadData()
    }
  }

  async function handleAdd() {
    if (!addForm.data_hora) {
      toast.error('Selecione a data e hora')
      return
    }
    if (!addForm.tipo) {
      toast.error('Selecione o tipo')
      return
    }
    
    setAdding(true)
    
    const { error } = await supabase.from('registos_ponto').insert({
      funcionario_id: id,
      obra_id: addForm.obra_id || null,
      tipo: addForm.tipo,
      estado: 'manual',
      data_hora: new Date(addForm.data_hora).toISOString(),
      localizacao_endereco: addForm.localizacao_endereco || null,
    })
    
    setAdding(false)
    
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Registo adicionado!')
      setShowAddModal(false)
      setAddForm({ tipo: 'entrada', obra_id: '', data_hora: '', localizacao_endereco: '' })
      loadData()
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-700'
      case 'saida': return 'bg-red-100 text-red-700'
      case 'entrada_almoco': return 'bg-yellow-100 text-yellow-700'
      case 'retorno_almoco': return 'bg-blue-100 text-blue-700'
      case 'atestado': return 'bg-purple-100 text-purple-700'
      case 'folga': return 'bg-pink-100 text-pink-700'
      case 'ferias': return 'bg-cyan-100 text-cyan-700'
      case 'faltas': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'atestado': return '🩺 Atestado'
      case 'folga': return '🏖️ Folga'
      case 'ferias': return '✈️ Férias'
      case 'faltas': return '❌ Faltas'
      default: return tipo
    }
  }

  const pontosPorDia = pontos.reduce((acc: any, p: any) => {
    const dia = format(new Date(p.data_hora), 'yyyy-MM-dd')
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(p)
    return acc
  }, {})

  if (loading) return <div className="p-8">A carregar...</div>
  if (!funcionario) return <div className="p-8">Funcionário não encontrado</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/rh/${id}`)} className="text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar ao dossiê
          </button>
          <h1 className="text-2xl font-bold">Ponto: {funcionario.nome_completo}</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Adicionar Registo
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('diario')} className={`btn ${view === 'diario' ? 'btn-primary' : ''}`}>
          Vista Diária
        </button>
        <button onClick={() => setView('mensal')} className={`btn ${view === 'mensal' ? 'btn-primary' : ''}`}>
          Vista Mensal
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))} className="btn">
          ← Mês Anterior
        </button>
        <h2 className="text-lg font-semibold">
          {format(mesAtual, 'MMMM yyyy', { locale: pt })}
        </h2>
        <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))} className="btn">
          Próximo Mês →
        </button>
      </div>

      {view === 'diario' && (
        <div className="space-y-4">
          {Object.entries(pontosPorDia).map(([dia, regs]: [string, any]) => (
            <div key={dia} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">
                {format(new Date(dia), "EEEE, d 'de' MMMM", { locale: pt })}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2">Hora</th>
                      <th className="py-2">Tipo</th>
                      <th className="py-2">Obra</th>
                      <th className="py-2">Origem</th>
                      <th className="py-2">Observação</th>
                      <th className="py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((p: any) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{format(new Date(p.data_hora), 'HH:mm')}</td>
                        <td className="py-2">
                          <span className={`pill ${getTipoColor(p.tipo)}`}>
                            {getTipoLabel(p.tipo)}
                          </span>
                        </td>
                        <td className="py-2 max-w-[150px]">
                          {p.obra_id && p.obras ? (
                            <div className="text-xs">
                              <p className="font-medium truncate">{p.obras.nome}</p>
                              {p.obras.rua && (
                                <p className="text-gray-400 truncate">
                                  {p.obras.rua}{p.obras.numero ? `, ${p.obras.numero}` : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            p.estado === 'manual' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {p.estado === 'manual' ? 'Manual' : 'GPS'}
                          </span>
                        </td>
                        <td className="py-2 max-w-[180px]">
                          <p className="text-xs truncate text-gray-600" title={p.localizacao_endereco || '—'}>
                            {p.localizacao_endereco || (p.localizacao_lat ? `${p.localizacao_lat?.toFixed(4)}, ${p.localizacao_lon?.toFixed(4)}` : '—')}
                          </p>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditOpen(p)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {Object.keys(pontosPorDia).length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhum registo neste mês.</p>
          )}
        </div>
      )}

      {view === 'mensal' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-medium text-gray-500">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {eachDayOfInterval({ start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) }).map(dia => {
              const diaStr = format(dia, 'yyyy-MM-dd')
              const regs = pontosPorDia[diaStr] || []
              
              return (
                <div key={diaStr} className={`p-2 rounded-lg border min-h-[80px] ${
                  regs.some((r: any) => ['atestado', 'folga', 'ferias', 'faltas'].includes(r.tipo))
                    ? 'bg-purple-50 border-purple-200'
                    : regs.length > 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="text-xs font-medium mb-1">{format(dia, 'd')}</div>
                  {regs.length > 0 && (
                    <div className="space-y-1 flex flex-wrap gap-0.5">
                      {regs.map((r: any, i: number) => (
                        <span key={i} className={`text-[9px] px-1 py-0.5 rounded ${getTipoColor(r.tipo)}`}>
                          {r.tipo.substring(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-50 border border-green-200 rounded"></span> Entrada/Saída</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-50 border border-purple-200 rounded"></span> Atestado/Folga/Férias/Faltas</span>
          </div>
        </div>
      )}

      {/* Modal Adicionar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Adicionar Registo de Ponto
              </h2>
              <button onClick={() => setShowAddModal(false)} className="btn p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data</label>
                  <input
                    type="date"
                    value={addForm.data_hora ? addForm.data_hora.split('T')[0] : ''}
                    onChange={e => setAddForm({...addForm, data_hora: `${e.target.value}T${addForm.data_hora ? addForm.data_hora.split('T')[1] : '08:00'}`})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Hora</label>
                  <input
                    type="time"
                    value={addForm.data_hora ? addForm.data_hora.split('T')[1] || '08:00' : '08:00'}
                    onChange={e => setAddForm({...addForm, data_hora: `${addForm.data_hora ? addForm.data_hora.split('T')[0] : format(new Date(), 'yyyy-MM-dd')}T${e.target.value}`})}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Tipo de Registo</label>
                <select value={addForm.tipo} onChange={e => setAddForm({...addForm, tipo: e.target.value})} className="input">
                  <optgroup label="Ponto">
                    <option value="entrada">📍 Entrada</option>
                    <option value="saida">🏁 Saída</option>
                    <option value="entrada_almoco">🍽️ Entrada Almoço</option>
                    <option value="retorno_almoco">🔙 Retorno Almoço</option>
                  </optgroup>
                  <optgroup label="Ausências">
                    <option value="atestado">🩺 Atestado</option>
                    <option value="folga">🏖️ Folga</option>
                    <option value="ferias">✈️ Férias</option>
                    <option value="faltas">❌ Faltas</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="label">Obra (opcional)</label>
                <select value={addForm.obra_id} onChange={e => setAddForm({...addForm, obra_id: e.target.value})} className="input">
                  <option value="">Sem obra / Não atribuído</option>
                  <optgroup label="Ativas">
                    {obras.filter(o => o.estado === 'ativa').map(o => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Em Preparação">
                    {obras.filter(o => o.estado === 'em_preparacao').map(o => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Encerradas">
                    {obras.filter(o => !['ativa', 'em_preparacao'].includes(o.estado)).map(o => (
                      <option key={o.id} value={o.id}>{o.nome} (Encerrada)</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              <div>
                <label className="label">Observação / Descrição</label>
                <input
                  type="text"
                  value={addForm.localizacao_endereco}
                  onChange={e => setAddForm({...addForm, localizacao_endereco: e.target.value})}
                  className="input"
                  placeholder="Ex: Atestado médico, Dia compensação, etc."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn flex-1">Cancelar</button>
              <button onClick={handleAdd} disabled={adding} className="btn btn-primary flex-1">
                {adding ? 'A adicionar...' : '✓ Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editPonto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Registo</h2>
              <button onClick={() => setEditPonto(null)} className="btn p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Data e Hora</label>
                <input 
                  type="datetime-local" 
                  value={editDataHora}
                  onChange={e => setEditDataHora(e.target.value)}
                  className="input" 
                />
              </div>
              
              <div>
                <label className="label">Tipo</label>
                <select value={editForm.tipo} onChange={e => setEditForm({...editForm, tipo: e.target.value})} className="input">
                  <optgroup label="Ponto">
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="entrada_almoco">Entrada Almoço</option>
                    <option value="retorno_almoco">Retorno Almoço</option>
                  </optgroup>
                  <optgroup label="Ausências">
                    <option value="atestado">🩺 Atestado</option>
                    <option value="folga">🏖️ Folga</option>
                    <option value="ferias">✈️ Férias</option>
                    <option value="faltas">❌ Faltas</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="label">Obra</label>
                <select value={editObraId} onChange={e => setEditObraId(e.target.value)} className="input">
                  <option value="">Sem obra / Não atribuído</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Observação</label>
                <input type="text" value={editForm.localizacao_endereco} onChange={e => setEditForm({...editForm, localizacao_endereco: e.target.value})} className="input" placeholder="Ex: Atestado médico..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude</label>
                  <input type="text" value={editForm.localizacao_lat} onChange={e => setEditForm({...editForm, localizacao_lat: e.target.value})} className="input" placeholder="-23.5505" />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input type="text" value={editForm.localizacao_lon} onChange={e => setEditForm({...editForm, localizacao_lon: e.target.value})} className="input" placeholder="-46.6333" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditPonto(null)} className="btn flex-1">Cancelar</button>
              <button onClick={handleEditSave} disabled={saving} className="btn btn-primary flex-1">
                <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}