// web/app/login/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [bloqueadoMsg, setBloqueadoMsg] = useState(searchParams.get('bloqueado') === 'true')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    
    if (data.user) {
      // Verificar se o perfil está ativo
      const { data: perfilData } = await supabase.from('perfis').select('acessos, papel, ativo').eq('id', data.user.id).single()
      
      if (perfilData && perfilData.ativo === false) {
        await supabase.auth.signOut()
        toast.error('Acesso bloqueado. Contacte o administrador.')
        setLoading(false)
        return
      }
      
      const acessos = perfilData?.acessos || []
      
      // Ordem de prioridade para redirecionamento
      const ordemPaginas = ['/dashboard', '/obras', '/ponto', '/rh', '/compras', '/financeiro', '/relatorios', '/cotacoes', '/integracoes', '/admin/usuarios']
      
      let redirectTo = '/ponto' // Fallback padrão
      for (const pagina of ordemPaginas) {
        const chaveModulo = pagina.replace('/', '').replace('admin/usuarios', 'acessos').replace('relatorios', 'relatorios')
        if (acessos.includes(chaveModulo) || perfilData?.papel === 'administrador') {
          redirectTo = pagina
          break
        }
      }
      
      window.location.href = redirectTo
    } else {
      toast.error('Erro desconhecido')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 20 20">
              <rect x="2" y="10" width="5" height="8" rx="1" fill="currentColor" opacity=".8"/>
              <rect x="7.5" y="6" width="5" height="12" rx="1" fill="currentColor"/>
              <rect x="13" y="2" width="5" height="16" rx="1" fill="currentColor" opacity=".6"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-lg leading-none">ConstruTrack</div>
            <div className="text-xs text-gray-500 mt-0.5">Gestão de Obra</div>
          </div>
        </div>

        {bloqueadoMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Acesso bloqueado. O seu utilizador foi desativado. Contacte o administrador.</span>
          </div>
        )}
        {!bloqueadoMsg && searchParams.get('expired') === 'true' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Sessão expirada. Faça login novamente.</span>
          </div>
        )}
        <div className="card">
          <h1 className="text-base font-semibold mb-5">Entrar na plataforma</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="input" placeholder="diretor@empresa.pt"
              />
            </div>
            <div>
              <label className="label">Palavra-passe</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}