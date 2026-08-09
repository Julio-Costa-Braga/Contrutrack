// web/app/(app)/obras/nova/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NovaObraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    // Buscar user do auth via API
    const userRes = await fetch('/api/me')
    const userData = await userRes.json()
    
    const pais = formData.get('pais') as string || 'Portugal'
    const distrito = formData.get('distrito') as string || ''
    const cidade = formData.get('cidade') as string || ''
    const rua = formData.get('rua') as string || ''
    const numero = formData.get('numero') as string || ''
    const codigoPostal = formData.get('codigo_postal') as string || ''
    
    // Construir morada completa para geocodificação
    const moradaCompleta = `${rua} ${numero}, ${codigoPostal}, ${cidade}, ${distrito}, ${pais}`.trim()
    
    // Geocodificação: converter morada em latitude/longitude
    let latitude: number | null = null
    let longitude: number | null = null
    
    if (rua && cidade) {
      try {
        setGeocoding(true)
        const query = encodeURIComponent(moradaCompleta)
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
        const data = await resp.json()
        if (data && data.length > 0) {
          latitude = parseFloat(data[0].lat)
          longitude = parseFloat(data[0].lon)
        }
      } catch (err) {
        console.error('Erro na geocodificação:', err)
        toast.error('Aviso: Não foi possível obter coordenadas GPS automaticamente')
      } finally {
        setGeocoding(false)
      }
    }
    
    const body = {
      nome: formData.get('nome'),
      morada: rua,
      cidade: cidade,
      distrito: distrito,
      pais: pais,
      rua: rua,
      numero: numero,
      codigo_postal: codigoPostal,
      orcamento_total: formData.get('orcamento_total') ? parseFloat(formData.get('orcamento_total') as string) : null,
      custo_real: formData.get('custo_real') ? parseFloat(formData.get('custo_real') as string) : 0,
      data_inicio: formData.get('data_inicio') || null,
      data_fim_prev: formData.get('data_fim_prev') || null,
      hora_entrada: formData.get('hora_entrada') || '07:30',
      hora_saida: formData.get('hora_saida') || '17:00',
      hora_almoco_ini: formData.get('hora_almoco_ini') || '13:00',
      hora_almoco_fim: formData.get('hora_almoco_fim') || '14:00',
      latitude: latitude,
      longitude: longitude,
      raio_geofence: formData.get('raio_geofence') ? parseInt(formData.get('raio_geofence') as string) : 100,
      estado: 'ativa',
      criado_por: userData.user?.id || null,
    }

    const res = await fetch('/api/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    
    if (data.error) {
      console.error('Erro ao criar obra:', data.error)
      toast.error(`Erro: ${data.error}`)
    } else {
      if (data.aviso) {
        toast.success('Obra criada, mas sem dados de endereço completos!')
        toast.error(data.aviso)
        // Mostrar link para migração
        setTimeout(() => {
          if (confirm('A obra foi criada, mas a base de dados precisa de migração para guardar o endereço completo. Queres ir para a página de migração?')) {
            window.location.href = '/admin/migrate'
          }
        }, 1000)
      } else {
        toast.success('Obra criada com sucesso!')
      }
      toast.success('Obra criada com sucesso!')
      if (data.obra?.id) {
        router.push(`/obras/${data.obra.id}`)
      } else {
        router.push('/obras')
      }
    }
    
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/obras" className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Voltar aos estaleiros
        </Link>
      </div>

      <div className="card max-w-2xl">
        <h1 className="text-lg font-semibold mb-6">Nova Obra / Estaleiro</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome da obra *</label>
              <input name="nome" required className="input" placeholder="Ex: Edifício Residence" />
            </div>

            <div>
              <label className="label">País</label>
              <input name="pais" className="input" defaultValue="Portugal" placeholder="Portugal" />
            </div>

            <div>
              <label className="label">Distrito</label>
              <input name="distrito" className="input" placeholder="Lisboa" />
            </div>

            <div>
              <label className="label">Cidade</label>
              <input name="cidade" className="input" placeholder="Lisboa" />
            </div>

            <div>
              <label className="label">Código Postal</label>
              <input name="codigo_postal" className="input" placeholder="1100-001" />
            </div>

            <div className="col-span-2">
              <label className="label">Rua</label>
              <input name="rua" className="input" placeholder="Rua Augusta" />
            </div>

            <div className="col-span-2">
              <label className="label">Número</label>
              <input name="numero" className="input" placeholder="100" />
            </div>

            <div>
              <label className="label">Orçamento (€)</label>
              <input name="orcamento_total" type="number" step="0.01" className="input" placeholder="0.00" />
            </div>

            <div>
              <label className="label">Custo real (€)</label>
              <input name="custo_real" type="number" step="0.01" className="input" defaultValue="0" />
            </div>

            <div>
              <label className="label">Data início</label>
              <input name="data_inicio" type="date" className="input" />
            </div>

            <div>
              <label className="label">Data fim prevista</label>
              <input name="data_fim_prev" type="date" className="input" />
            </div>

            <div>
              <label className="label">Hora entrada</label>
              <input name="hora_entrada" type="time" className="input" defaultValue="07:30" />
            </div>

            <div>
              <label className="label">Hora saída</label>
              <input name="hora_saida" type="time" className="input" defaultValue="17:00" />
            </div>

            <div>
              <label className="label">Início almoço</label>
              <input name="hora_almoco_ini" type="time" className="input" defaultValue="13:00" />
            </div>

            <div>
              <label className="label">Fim almoço</label>
              <input name="hora_almoco_fim" type="time" className="input" defaultValue="14:00" />
            </div>

            <div className="col-span-2 border-t pt-4 mt-2">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Geofence (GPS - Obtido Automaticamente)
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                As coordenadas GPS serão obtidas automaticamente a partir da morada inserida.
                {geocoding && <span className="text-blue-600"> A obter coordenadas...</span>}
              </p>
            </div>

            <div>
              <label className="label">Raio geofence (m)</label>
              <input name="raio_geofence" type="number" className="input" defaultValue="100" />
              <p className="text-xs text-gray-400 mt-1">Raio de tolerância para o ponto</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Link href="/obras" className="btn">Cancelar</Link>
            <button type="submit" disabled={loading || geocoding} className="btn btn-primary">
              {loading ? 'A criar...' : geocoding ? 'A obter GPS...' : 'Criar obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
