// web/app/(app)/relatorios/page.tsx
import { createClient } from '@/lib/supabase/server'
import GerarRelatorioPDF from '@/components/modules/GerarRelatorioPDF'

export default async function RelatoriosPage() {
  const supabase = createClient()

  const [obras, alertasDocs] = await Promise.all([
    supabase.from('obras').select('id,nome').eq('estado','ativa'),
    supabase.from('documentos_funcionario')
      .select('estado')
      .in('estado', ['expirado','a_expirar']),
  ])

  const docsExpirados  = alertasDocs.data?.filter(d => d.estado === 'expirado').length ?? 0
  const docsAExpirar   = alertasDocs.data?.filter(d => d.estado === 'a_expirar').length ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Relatórios ACT</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Autoridade para as Condições de Trabalho · Portugal
        </p>
      </div>

      {/* Info ACT */}
      <div className="card mb-6 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <div className="text-blue-500 text-lg">ℹ</div>
          <div>
            <p className="text-sm font-medium text-blue-900">Relatório pronto para fiscalização ACT</p>
            <p className="text-xs text-blue-700 mt-1">
              O PDF gerado inclui todas as batidas de ponto com hora exata, selfie do funcionário,
              coordenadas GPS e confirmação de geofence por estaleiro — pronto para apresentar ao inspetor.
              Horas extra calculadas conforme o Código do Trabalho (Lei 7/2009).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Status de conformidade */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4">Estado de conformidade</h2>
          <div className="space-y-3">
            {[
              { label: 'Ponto eletrónico com GPS e selfie', ok: true },
              { label: 'Horas extra calculadas (DP)', ok: true },
              { label: 'Subsídio de alimentação', ok: true },
              { label: `Documentos SHT expirados`, ok: docsExpirados === 0, warn: docsExpirados > 0, count: docsExpirados },
              { label: `Documentos a expirar (<30d)`, ok: docsAExpirar === 0, warn: docsAExpirar > 0, count: docsAExpirar },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={item.ok ? 'text-green-500' : item.warn ? 'text-amber-500' : 'text-red-500'}>
                  {item.ok ? '✓' : '⚠'}
                </span>
                <span className={item.ok ? 'text-gray-700' : 'text-amber-700 font-medium'}>
                  {item.label}
                  {item.count ? ` (${item.count})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* O que o PDF inclui */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4">O relatório PDF inclui</h2>
          <ul className="space-y-2 text-xs text-gray-600">
            {[
              'Registo de batidas com hora exata (entrada e saída)',
              'Selfie do funcionário por batida (prova de presença)',
              'Coordenadas GPS + confirmação de geofence por estaleiro',
              'Cálculo de horas extra (conforme Lei 7/2009)',
              'Subsídio de alimentação por funcionário',
              'Validade de atestados médicos e certificados SHT',
              'Assinatura digital e carimbo temporal',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gerador de PDF */}
      <GerarRelatorioPDF obras={obras.data ?? []} />
    </div>
  )
}
