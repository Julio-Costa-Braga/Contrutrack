// web/app/(app)/ponto/page.tsx
import { createAuthenticatedClient } from '@/lib/supabase/server'
import RegistarPontoForm from '@/components/modules/RegistarPontoForm'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function PontoPage() {
  const supabase = await createAuthenticatedClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: funcData } = await supabase
    .from('funcionarios')
    .select('id, user_id, nome_completo')
    .eq('user_id', user?.id || '')
    .maybeSingle()

  let funcionarioId = funcData?.id
  if (!funcionarioId && user?.email) {
    const { data: funcByEmail } = await supabase
      .from('funcionarios')
      .select('id')
      .ilike('email', user.email)
      .maybeSingle()

    if (funcByEmail) {
      funcionarioId = funcByEmail.id
      await supabase.from('funcionarios').update({ user_id: user.id }).eq('id', funcionarioId)
    }
  }
  
  const { data: obrasAssociadas } = await supabase
    .from('funcionario_obras')
    .select(`obra:obra_id(id, nome, latitude, longitude, raio_geofence, rua, numero, codigo_postal, estado)`)
    .eq('funcionario_id', funcionarioId || '')
    .eq('ativo', true)
  
  const obrasAtivas = (obrasAssociadas || [])
    .map((fo: any) => fo.obra)
    .filter((o: any) => o && ['ativa', 'em_preparacao'].includes(o.estado))

  const { data: pontosHoje } = await supabase
    .from('registos_ponto')
    .select(`
      *,
      funcionarios(nome_completo,nif),
      obras(nome, rua, numero, codigo_postal)
    `)
    .gte('data_hora', new Date().toISOString().split('T')[0])
    .order('data_hora', { ascending: false })
    .limit(50)
    
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Ponto Eletrónico</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: pt })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <RegistarPontoForm obras={obrasAtivas || []} />

        {/* Equipa hoje */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4">Presenças de hoje</h2>
          {pontosHoje?.length === 0 ? (
            <p className="text-sm text-gray-400">Sem registos hoje.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 text-gray-500 font-medium">Funcionário</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Hora</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Tipo</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Obra</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Local</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Selfie</th>
                  </tr>
                </thead>
                <tbody>
                  {pontosHoje?.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 font-medium">{p.funcionarios?.nome_completo?.split(' ')[0]}</td>
                      <td className="py-2">{format(new Date(p.data_hora), 'HH:mm')}</td>
                      <td className="py-2">
                        <span className={`pill ${p.tipo === 'entrada' ? 'pill-green' : 'pill-gray'}`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td className="py-2 max-w-[150px]">
                        <div className="text-xs">
                          <p className="font-medium truncate">{p.obras?.nome || '—'}</p>
                          <p className="text-gray-400 truncate">
                            {p.obras?.rua}{p.obras?.numero ? `, ${p.obras.numero}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="py-2 max-w-[150px]">
                        <p className="text-xs truncate">
                          {p.localizacao_endereco || (p.localizacao_lat ? `${p.localizacao_lat?.toFixed(4)}, ${p.localizacao_lon?.toFixed(4)}` : '—')}
                        </p>
                      </td>
                      <td className="py-2">
                        {p.selfie_url
                          ? <a href={p.selfie_url} target="_blank" className="text-blue-600 underline">ver</a>
                          : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
