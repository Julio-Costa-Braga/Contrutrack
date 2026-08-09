// web/components/modules/RegistarPontoForm.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader, CheckCircle, MapPin, Loader2, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Obra } from '@/types/database'

interface Props { obras: Pick<Obra, 'id'|'nome'|'latitude'|'longitude'|'raio_geofence'|'rua'|'numero'|'codigo_postal'>[] }

export default function RegistarPontoForm({ obras }: Props) {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [obraId, setObraId] = useState('')
  const [tipo, setTipo] = useState<'entrada'|'saida'|'entrada_almoco'|'retorno_almoco'>('entrada')
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [camaraAberta, setCamaraAberta] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [gpsLocation, setGpsLocation] = useState<{lat: number; lon: number; precisao: number} | null>(null)
  const [obtendoGps, setObtendoGps] = useState(false)
  const [editandoManual, setEditandoManual] = useState(false)
  const [enderecoManual, setEnderecoManual] = useState('')

  useEffect(() => {
    obterGpsAutomatico()
  }, [])

  const obterGpsAutomatico = () => {
    if (!navigator.geolocation) return
    
    setObtendoGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          precisao: pos.coords.accuracy
        })
        setObtendoGps(false)
      },
      () => {
        setObtendoGps(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamaraAberta(true)
      toast.success('Câmara aberta! Clica em Capturar')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão da câmara negada. Ativa nas definições do browser.')
      } else {
        toast.error('Não foi possível aceder à câmara')
      }
    }
  }

  const tirarSelfie = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Câmara não disponível')
      return
    }
    
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Aguarde a câmara carregar')
      return
    }
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) {
      toast.error('Erro ao capturar imagem')
      return
    }
    
    canvasRef.current.width = video.videoWidth
    canvasRef.current.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        toast.error('Erro ao guardar imagem')
        return
      }
      setSelfieBlob(blob)
      setSelfiePreview(canvasRef.current!.toDataURL('image/jpeg', 0.8))
      streamRef.current?.getTracks().forEach(t => t.stop())
      setCamaraAberta(false)
      toast.success('Selfie capturada!')
    }, 'image/jpeg', 0.8)
  }

  const obra = obras.find(o => o.id === obraId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!obraId) { toast.error('Selecione a obra'); return }
    if (!obra) { toast.error('Obra não encontrada'); return }

    const localizacao = editandoManual ? enderecoManual : (gpsLocation ? `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lon.toFixed(6)}` : '')

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      let { data: func } = await supabase
        .from('funcionarios').select('id').eq('user_id', user.id).maybeSingle()
      
      if (!func && user.email) {
        const { data: func2 } = await supabase
          .from('funcionarios').select('id').ilike('email', user.email)
          .maybeSingle()
        if (func2) {
          func = func2
          await supabase.from('funcionarios').update({ user_id: user.id }).eq('id', func2.id)
        }
      }
      
      if (!func) {
        throw new Error('Funcionário não encontrado. Contacta o RH.')
      }

      let selfie_url = null
      if (selfieBlob) {
        const path = `${func?.id ?? user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('selfies').upload(path, selfieBlob, { contentType: 'image/jpeg' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('selfies').getPublicUrl(path)
          selfie_url = urlData.publicUrl
        }
      }

      const { error } = await supabase.from('registos_ponto').insert({
        funcionario_id: func?.id,
        obra_id: obraId,
        tipo,
        estado: selfie_url ? 'valido' : 'sem_selfie',
        rua: obra?.rua || null,
        numero: obra?.numero || null,
        codigo_postal: obra?.codigo_postal || null,
        selfie_url,
        biometria_ok: !!selfie_url,
        localizacao_lat: gpsLocation?.lat || null,
        localizacao_lon: gpsLocation?.lon || null,
        localizacao_endereco: editandoManual ? enderecoManual : null,
      })

      if (error) {
        console.error('Erro ao registar ponto:', error)
        throw new Error(error.message)
      }

      toast.success(`Ponto [${tipo}] registado com sucesso!`)
      setSelfieBlob(null); setSelfiePreview(null)
      setTipo('entrada')
      setEditandoManual(false)
      setEnderecoManual('')
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao registar ponto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold mb-4">Registar ponto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Obra */}
        <div>
          <label className="label">Estaleiro</label>
          <select value={obraId} onChange={e => setObraId(e.target.value)} className="input">
            <option value="">Selecione a obra...</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'entrada', label: 'Entrada' },
            { value: 'saida', label: 'Saída' },
            { value: 'entrada_almoco', label: 'Entrada Almoço' },
            { value: 'retorno_almoco', label: 'Retorno Almoço' },
          ] as const).map(t => (
            <button key={t.value} type="button"
              onClick={() => { setTipo(t.value); abrirCamara() }}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                tipo === t.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Endereço da Obra */}
        {obra && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">📍 Local da Obra</p>
            <p className="text-sm font-medium">{obra.rua}{obra.numero ? `, ${obra.numero}` : ''}</p>
            <p className="text-xs text-gray-500">{obra.codigo_postal || ''}</p>
          </div>
        )}

        {/* GPS / Localização do Funcionário */}
        <div className="space-y-2">
          {!editandoManual ? (
            <>
              <button type="button" onClick={obterGpsAutomatico}
                className="btn w-full justify-center"
                disabled={obtendoGps}
              >
                {obtendoGps ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {obtendoGps ? 'A obter GPS...' : 'Atualizar GPS'}
              </button>
              
              {gpsLocation && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">📌 GPS capturado</p>
                  <p className="text-sm font-mono">{gpsLocation.lat.toFixed(6)}, {gpsLocation.lon.toFixed(6)}</p>
                  <p className="text-xs text-gray-400 mt-1">Precisão: ±{Math.round(gpsLocation.precisao)}m</p>
                </div>
              )}
              
              <button type="button" onClick={() => setEditandoManual(true)}
                className="btn w-full justify-center text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Edit3 className="w-4 h-4" /> Inserir endereço manualmente
              </button>
            </>
          ) : (
            <>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-orange-600 font-medium mb-2">📝 Inserir localização manualmente</p>
                <input
                  type="text"
                  value={enderecoManual}
                  onChange={e => setEnderecoManual(e.target.value)}
                  placeholder="Rua, Número, CEP"
                  className="input"
                  autoFocus
                />
              </div>
              <button type="button" onClick={() => setEditandoManual(false)}
                className="btn w-full justify-center"
              >
                <MapPin className="w-4 h-4" /> Voltar ao GPS
              </button>
            </>
          )}
        </div>

        {/* Selfie */}
        <div>
          {!camaraAberta && !selfiePreview && (
            <button type="button" onClick={abrirCamara} className="btn w-full justify-center">
              <Camera className="w-4 h-4" /> Tirar selfie
            </button>
          )}
          {camaraAberta && (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg aspect-video object-cover bg-black" />
              <button type="button" onClick={tirarSelfie} className="btn btn-primary w-full justify-center">
                <Camera className="w-4 h-4" /> Capturar
              </button>
            </div>
          )}
          {selfiePreview && (
            <div className="relative">
              <img src={selfiePreview} alt="Selfie" className="w-full rounded-lg aspect-video object-cover" />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Selfie
              </div>
              <button type="button" onClick={() => { setSelfieBlob(null); setSelfiePreview(null) }}
                className="mt-1 text-xs text-gray-500 underline"
              >Nova selfie</button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-2.5">
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'A registar...' : `Registar ${tipo}`}
        </button>
      </form>
    </div>
  )
}
