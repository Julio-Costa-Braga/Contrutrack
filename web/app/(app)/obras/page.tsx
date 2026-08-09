// web/app/(app)/obras/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, MapPin, Calendar, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ObrasPage() {
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('obras')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      setObras(data || [])
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const obrasAtivas = obras.filter(o => o.estado === 'ativa').length

return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Estaleiros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{obrasAtivas} obras ativas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/obras/nova" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Nova Obra
          </Link>
          <Link href="/lixeira" className="btn bg-gray-100 hover:bg-gray-200">
            <Trash2 className="w-4 h-4" /> Lixeira
          </Link>
        </div>
      </div>
      
      {obras?.length === 0 ? (
        <div className="card">
          <p className="text-gray-400">Nenhuma obra criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <Link key={obra.id} href={`/obras/${obra.id}`} className="card hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{obra.nome}</h3>
                <span className={`pill ${
                  obra.estado === 'ativa' ? 'pill-green' : 
                  obra.estado === 'concluida' ? 'pill-blue' : 'pill-gray'
                }`}>
                  {obra.estado}
                </span>
              </div>
              
              {obra.morada && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {obra.morada}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {obra.data_inicio && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {new Date(obra.data_inicio).toLocaleDateString('pt-PT')}
                  </span>
                )}
                {obra.orcamento_total && (
                  <span>€{obra.orcamento_total.toLocaleString('pt-PT')}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}