import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const tokenCookie = allCookies.find(c => c.name.includes('auth-token'))
  
  if (!tokenCookie) {
    return NextResponse.json({ error: 'No token cookie found' })
  }
  
  let tokenData = null
  try {
    tokenData = JSON.parse(tokenCookie.value)
  } catch (e: any) {
    return NextResponse.json({ error: 'Parse error', details: e.message })
  }
  
  if (!tokenData?.access_token) {
    return NextResponse.json({ error: 'No access_token in cookie' })
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      }
    }
  )
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ 
      error: 'User null', 
      userError: userError?.message
    })
  }

  const funciQuery = await supabase
    .from('funcionarios')
    .select('id, nome_completo, email, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const funcId = funciQuery?.data?.id || funciQuery?.data?.user_id

  const obrasQuery = await supabase
    .from('funcionario_obras')
    .select(`*, obra:obra_id(id, nome, estado, latitude, longitude)`)
    .eq('funcionario_id', funcId || '')
    .eq('ativo', true)

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    funciQuery: funciQuery,
    funcId: funcId,
    obrasQuery: obrasQuery
  })
}
