import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const { sql } = await request.json()
  
  try {
    // Usar o método rpc se existir a função exec, senão tentar via supabase
    const { error } = await supabase.rpc('exec', { sql })
    
    if (error) {
      // Se a função exec não existir, tentar uma abordagem diferente
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
