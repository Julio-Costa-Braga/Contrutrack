import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createAdminClient()
  
  try {
    // Tentar adicionar colunas (vai falhar se já existirem, o que é esperado)
    const queries = [
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Portugal'`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS rua TEXT`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS numero TEXT`,
      `ALTER TABLE obras ADD COLUMN IF NOT EXISTS codigo_postal TEXT`
    ]
    
    for (const sql of queries) {
      await supabase.rpc('exec', { sql })
    }
    
    return NextResponse.json({ success: true, message: 'Colunas adicionadas com sucesso' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
