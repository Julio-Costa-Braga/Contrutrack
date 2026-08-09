import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('obras').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  
  // Campos novos que podem não existir na BD
  const CAMPOS_NOVOS = ['pais', 'rua', 'numero', 'codigo_postal', 'distrito']
  
  try {
    // Tentar insert com todos os campos
    const { data, error } = await supabase.from('obras').insert(body).select().single()
    
    if (error) {
      // Se erro é sobre coluna inexistente, tentar sem os campos novos
      const isColumnError = CAMPOS_NOVOS.some(campo => error.message.includes(campo)) ||
                           error.message.includes("schema cache") ||
                           error.message.includes("does not exist")
      
      if (isColumnError) {
        const bodySemNovos = { ...body }
        CAMPOS_NOVOS.forEach(campo => delete bodySemNovos[campo])
        
        const { data: data2, error: error2 } = await supabase.from('obras').insert(bodySemNovos).select().single()
        if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
        
    // Se tem orçamento, criar transação
        if (data2?.orcamento_total && data2.orcamento_total > 0) {
          const { error: transError } = await supabase.from('transacoes').insert({
            descricao: `Orçamento: ${data2.nome}`,
            valor: data2.orcamento_total,
            tipo: 'receita',
            categoria: 'Orçamento',
            data: new Date().toISOString().split('T')[0],
            obra_id: data2.id,
            criado_por: body.criado_por
          })
          if (transError) {
            console.error('Erro ao criar transação de orçamento:', transError)
          }
        }
        
        return NextResponse.json({ 
          obra: data2, 
          aviso: 'Aviso: Base de dados não atualizada. Os campos de endereço não foram guardados. Por favor, executa a migração em /admin/migrate' 
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Se tem orçamento, criar transação
    if (data?.orcamento_total && data.orcamento_total > 0) {
      await supabase.from('transacoes').insert({
        descricao: `Orçamento: ${data.nome}`,
        valor: data.orcamento_total,
        tipo: 'receita',
        categoria: 'Orçamento',
        data: new Date().toISOString().split('T')[0],
        obra_id: data.id,
        criado_por: body.criado_por
      })
    }
    
    return NextResponse.json({ obra: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  
  try {
    const { error } = await supabase.from('obras').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
