'use server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfis')
    .select('papel')
    .eq('id', user.id)
    .single()

  if (perfil?.papel !== 'administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await supabase
    .from('requisicoes')
    .update({ estado: 'aguarda_aprovacao_financeiro' })
    .eq('estado', 'aguarda_cotacao')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: 'Requisições atualizadas' })
}