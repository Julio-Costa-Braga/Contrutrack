// web/components/modules/AprovarRequisicaoBtn.tsx
'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { approveRequisicao, rejectRequisicao } from '@/lib/actions/compras'

interface Props { id: string; titulo: string; valor?: number; onApproved?: () => void }

export default function AprovarRequisicaoBtn({ id, titulo, valor, onApproved }: Props) {
  const [loading, setLoading] = useState<'approve'|'reject'|null>(null)
  const [motivo, setMotivo] = useState('')
  const [showMotivo, setShowMotivo] = useState(false)

  async function handleApprove() {
    setLoading('approve')
    const r = await approveRequisicao(id)
    if (r.ok) {
      toast.success(r.message || 'Requisição aprovada!')
      onApproved?.()
    } else {
      toast.error(r.error ?? 'Erro')
    }
    setLoading(null)
  }

  async function handleReject() {
    if (!motivo) { setShowMotivo(true); return }
    setLoading('reject')
    const r = await rejectRequisicao(id, motivo)
    if (r.ok) toast.success('Requisição rejeitada')
    else toast.error(r.error ?? 'Erro')
    setLoading(null)
    setShowMotivo(false)
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={handleApprove} disabled={!!loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors">
        {loading === 'approve' ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        Aprovar
      </button>

      {!showMotivo ? (
        <button onClick={() => setShowMotivo(true)} disabled={!!loading}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors">
          <XCircle className="w-3 h-3" /> Rejeitar
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input value={motivo} onChange={e => setMotivo(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-slate-800"
            placeholder="Motivo..." autoFocus />
          <button onClick={handleReject} disabled={!!loading}
            className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700">
            {loading === 'reject' ? <Loader className="w-3 h-3 animate-spin" /> : 'OK'}
          </button>
          <button onClick={() => setShowMotivo(false)} className="text-gray-400 text-xs px-1">✕</button>
        </div>
      )}
    </div>
  )
}