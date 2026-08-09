// web/lib/actions/compras.ts
'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function approveRequisicao(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: req } = await supabase.from('requisicoes').select('estado, valor_estimado, obra_id, titulo').eq('id', id).single()
  
  if (!req) return { error: 'Requisição não encontrada' }

  if (req.estado === 'aguarda_aprovacao_financeiro') {
    const adminClient = createAdminClient()
    
    const { error } = await supabase
      .from('requisicoes')
      .update({ estado: 'aprovado', aprovado_por: user.id, aprovado_em: new Date().toISOString() })
      .eq('id', id)
    
    if (error) return { error: error.message }
    
    if (req.obra_id && req.valor_estimado) {
      const { data: obra } = await supabase.from('obras').select('custo_real, nome').eq('id', req.obra_id).single()
      if (obra) {
        await supabase.from('obras').update({ 
          custo_real: (obra.custo_real || 0) + req.valor_estimado 
        }).eq('id', req.obra_id)
        
        const { error: transError } = await adminClient.from('transacoes').insert({
          descricao: `Aprovação: ${req.titulo}`,
          valor: req.valor_estimado,
          tipo: 'despesa',
          categoria: 'Materiais',
          data: new Date().toISOString().split('T')[0],
          obra_id: req.obra_id,
          criado_por: user.id,
          requisicao_id: id,
        })
        
        if (transError) console.error('Transacao error:', transError)
      }
    }
    
    return { ok: true, message: 'Aprovado!' }
  }

  const { error } = await supabase
    .from('requisicoes')
    .update({ estado: 'aguarda_aprovacao_financeiro' })
    .eq('id', id)
  
  if (error) return { error: error.message }
  
  await supabase.from('alertas').insert({
    tipo: 'aprovacao_financeiro',
    titulo: `Requisição pendente - EUR ${req.valor_estimado?.toLocaleString('pt-PT')}`,
    obra_id: req.obra_id,
  })
  
  return { ok: true, message: 'Enviado para aprovação do financeiro' }
}

export async function rejectRequisicao(id: string, motivo: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('requisicoes')
    .update({ estado: 'rejeitado', motivo_rejeicao: motivo })
    .eq('id', id)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function registarRecepcaoMaterial(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const requisicao_id = formData.get('requisicao_id') as string
  const quantidade_rec = formData.get('quantidade_rec') as string
  const guia_file = formData.get('guia_remessa') as File | null

  let guia_remessa_url = null
  if (guia_file && guia_file.size > 0) {
    const path = `guias/${requisicao_id}/${Date.now()}_${guia_file.name}`
    const { error } = await supabase.storage.from('guias-remessa').upload(path, guia_file)
    if (!error) {
      const { data } = supabase.storage.from('guias-remessa').getPublicUrl(path)
      guia_remessa_url = data.publicUrl
    }
  }

  const { error } = await supabase.from('recepcao_materiais').insert({
    requisicao_id,
    quantidade_rec: quantidade_rec ? parseFloat(quantidade_rec) : null,
    guia_remessa_url,
    recebido_por: user.id,
  })

  if (error) return { error: error.message }

  await supabase.from('requisicoes').update({ estado: 'entregue' }).eq('id', requisicao_id)

  return { ok: true }
}