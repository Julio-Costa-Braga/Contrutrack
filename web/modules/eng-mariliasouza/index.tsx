// web/modules/eng-mariliasouza/index.tsx
'use client'
import dynamic from 'next/dynamic'

const Formulario = dynamic(() => import('./pages/Formulario'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-sm text-gray-500">Carregando módulo de Vistorias…</div>
  ),
})

export default function VistoriaModule() {
  return (
    <div className="ems-root">
      <Formulario />
    </div>
  )
}
