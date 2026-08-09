import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  
  // Ver todas as transações de orçamento
  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('categoria', 'Orçamento')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ 
    total: data?.length || 0,
    transacoes: data 
  })
}
