import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { cotacaoId, requisicaoId } = await request.json()
  const supabase = createClient()
  
  await supabase.from('cotacoes').update({ selecionada: false }).eq('requisicao_id', requisicaoId)
  await supabase.from('cotacoes').update({ selecionada: true }).eq('id', cotacaoId)
  
  return NextResponse.json({ success: true })
}