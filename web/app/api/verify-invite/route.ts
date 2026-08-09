import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token em falta' }, { status: 400 })
    }

    const supabase = createClient() as any
    
    // Verificar o token de convite
    const { data, error } = await supabase
      .from('convites')
      .select('*, perfis(email)')
      .eq('token', token)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 400 })
    }

    return NextResponse.json({ 
      email: data.email,
      nome: data.nome,
      expires: data.expira_em 
    })
  } catch (error: any) {
    console.log('[verify-invite] ERRO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}