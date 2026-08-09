// web/app/(app)/layout.tsx
// Layout para todas as páginas autenticadas
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'

function parseJWT(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) { 
    return null 
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))
  
  let user = null
  if (authCookie) {
    try {
      const data = JSON.parse(authCookie.value)
      if (data.access_token) {
        const payload = parseJWT(data.access_token)
        if (payload?.sub) {
          user = { id: payload.sub, email: payload.email }
        }
      }
    } catch (e) {}
  }
  
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: perfil } = await supabase.from('perfis').select('*, acessos, alertas_pref').eq('id', user.id)
  
  if (!perfil || perfil.length === 0) redirect('/login')
  
  const perfilData = perfil[0]

  if (perfilData.ativo === false) {
    await supabase.auth.signOut()
    redirect('/login?bloqueado=true')
  }
  
  // Foto: primeiro do funcionário (via user_id), depois do perfil
  const { data: funcData } = await supabase
    .from('funcionarios')
    .select('foto_url')
    .eq('user_id', user.id)
    .maybeSingle()
  const fotoUrl = funcData?.foto_url || perfilData.avatar_url || null
  
  // Garantir que acessos e alertas_pref existem
  if (!perfilData.acessos) perfilData.acessos = ['ponto']
  if (!perfilData.alertas_pref) perfilData.alertas_pref = ['ponto_atraso', 'ponto_saida', 'requisicao_pendente', 'obra_orcamento']
  
  // Check if user has admin access
  if (perfilData.papel !== 'administrador') {
    const currentPath = cookies().get('x-current-path')?.value || ''
    // Allow access to /admin/usuarios if user has 'acessos' in their acessos array
    if (currentPath.startsWith('/admin') && !perfilData.acessos?.includes('acessos')) {
      redirect('/dashboard')
    }
  }

  const { data: alertasData } = await supabase
    .from('alertas').select('tipo').eq('lido', false)
  const alertas = {
    ponto: alertasData?.filter(a => a.tipo === 'ponto_anomalia').length ?? 0,
    rh: alertasData?.filter(a => a.tipo === 'doc_expirando').length ?? 0,
    compras: alertasData?.filter(a => a.tipo?.includes('aprovacao')).length ?? 0,
    alerta: alertasData?.filter(a => a.tipo?.startsWith('obra_orcamento')).length ?? 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar perfil={perfilData} alertas={alertas} fotoUrl={fotoUrl} />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-16 lg:pt-6">
        {children}
      </main>
    </div>
  )
}
