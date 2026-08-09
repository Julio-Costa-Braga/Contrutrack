// web/components/ui/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Building2, Clock, Users, UserPlus,
  ShoppingCart, FileText, LogOut, Settings, Link2, DollarSign, Calculator, AlertTriangle, CheckCircle, Menu, X
} from 'lucide-react'
import type { Perfil } from '@/types/database'
import clsx from 'clsx'
import { useState } from 'react'

const PAPEL_ACESSO: Record<string, string[]> = {
  administrador: ['dashboard', 'obras', 'ponto', 'rh', 'compras', 'relatorios', 'admin', 'integracoes', 'financeiro', 'aprovacoes', 'cotacoes', 'alertas', 'config'],
  gerente_obra: ['dashboard', 'obras', 'ponto'],
  rh_dp: ['dashboard', 'ponto', 'rh'],
  financeiro: ['dashboard', 'compras', 'aprovacoes', 'cotacoes', 'alertas', 'config'],
  ingeniero: ['dashboard', 'obras'],
  encarregado: ['dashboard', 'ponto'],
}

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',         icon: LayoutDashboard, key: 'dashboard' },
  { href: '/obras',           label: 'Estaleiros',        icon: Building2,        key: 'obras' },
  { href: '/ponto',           label: 'Ponto Eletrónico',  icon: Clock,            key: 'ponto', badge: 'ponto' },
  { href: '/rh',              label: 'RH & Onboarding',   icon: Users,            key: 'rh', badge: 'rh' },
  { href: '/rh/contratacao', label: 'Contratação',      icon: UserPlus,         key: 'contratacao' },
  { href: '/compras',         label: 'Compras',           icon: ShoppingCart,     key: 'compras', badge: 'compras' },
  { href: '/relatorios',      label: 'Relatórios ACT',    icon: FileText,         key: 'relatorios' },
  { section: 'financeiro' },
  { href: '/financeiro',      label: 'Visão Geral',       icon: DollarSign,       key: 'financeiro' },
  { href: '/financeiro/aprovacoes', label: 'Aprovações', icon: CheckCircle, key: 'aprovacoes' },
  { section: 'config' },
  { href: '/cotacoes',        label: 'Cotações',          icon: Calculator,       key: 'cotacoes' },
  { href: '/alertas',         label: 'Alertas',           icon: AlertTriangle,  key: 'alertas', badge: 'alerta' },
  { href: '/admin/integracoes', label: 'Integrações',    icon: Link2,            key: 'integracoes' },
  { href: '/admin/usuarios',  label: 'Acessos',          icon: Settings,         key: 'acessos' },
]

interface Props { perfil: Perfil; alertas?: Record<string, number>; fotoUrl?: string | null }

export default function Sidebar({ perfil, alertas = {}, fotoUrl }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  var acessos = perfil.acessos && perfil.acessos.length > 0
    ? [...perfil.acessos]
    : (PAPEL_ACESSO[perfil.papel] || [])

  if (!acessos.includes('ponto')) acessos = ['ponto', ...acessos]

  if (acessos.includes('aprovacoes') && !acessos.includes('financeiro')) {
    acessos.push('financeiro')
  }

  const filteredNavItems = navItems.filter(item => {
    if ('section' in item) return acessos.includes(item.section)
    return acessos.includes(item.key)
  })

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  const initials = perfil.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Hamburger button — apenas mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay — apenas mobile quando sidebar está aberta */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 h-screen',
        'w-60 transition-transform duration-200 ease-in-out',
        'lg:static lg:z-auto lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header com logo e botão fechar (mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16">
                <rect x="1" y="8" width="4" height="6" rx=".8" fill="currentColor" opacity=".8"/>
                <rect x="6" y="5" width="4" height="9" rx=".8" fill="currentColor"/>
                <rect x="11" y="2" width="4" height="12" rx=".8" fill="currentColor" opacity=".6"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">ConstruTrack</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Gestão de Obra</div>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 rounded hover:bg-gray-100" aria-label="Fechar menu">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Principal
          </p>
          {filteredNavItems.map((item) => {
            if ('section' in item) {
              return (
                <p key={item.section} className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 mt-2">
                  {item.section === 'financeiro' ? 'Financeiro' : item.section}
                </p>
              )
            }
            const Icon = item.icon!
            const count = item.badge ? alertas[item.badge] : 0
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href} href={item.href}
                onClick={closeSidebar}
                className={clsx('sidebar-item !pl-6', isActive && 'active')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
            {fotoUrl ? (
              <img src={fotoUrl} alt={perfil.nome_completo} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{perfil.nome_completo.split(' ')[0]}</div>
              <div className="text-[10px] text-gray-400 capitalize">{perfil.papel.replace('_', ' ')}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 p-1">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}