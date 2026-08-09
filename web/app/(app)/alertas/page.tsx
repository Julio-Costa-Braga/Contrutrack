'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Check, X, Loader } from 'lucide-react'
import Link from 'next/link'

export default function AlertasPage() {
  const supabase = createClient()
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlertas()
  }, [])

  async function loadAlertas() {
    setLoading(true)
    const { data } = await supabase.from('alertas').select('*').order('created_at', { ascending: false }).limit(100)
    setAlertas(data || [])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase.from('alertas').update({ lido: true }).eq('id', id)
    loadAlertas()
  }

  async function markAllAsRead() {
    for (const a of alertas) {
      if (!a.lido) await supabase.from('alertas').update({ lido: true }).eq('id', a.id)
    }
    loadAlertas()
  }

  const pendentes = alertas.filter(a => !a.lido)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Alertas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pendentes.length} alertas não lidos</p>
        </div>
        {pendentes.length > 0 && (
          <button onClick={markAllAsRead} className="btn">Marcar todos como lidos</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : alertas.length === 0 ? (
        <div className="card">
          <p className="text-gray-400">Sem alertas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map(a => (
            <div key={a.id} className={`card flex items-center justify-between ${!a.lido ? 'border-l-4 border-l-amber-400' : ''}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${a.urgente ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className="font-medium">{a.titulo}</p>
                  {a.mensagem && <p className="text-sm text-gray-500">{a.mensagem}</p>}
                  <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('pt-PT')}</p>
                </div>
              </div>
              {!a.lido && (
                <button onClick={() => markAsRead(a.id)} className="btn text-xs">
                  <Check className="w-3 h-3" /> Marcar lido
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}