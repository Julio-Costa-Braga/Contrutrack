import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Buscar o convite
    const { data: convite, error: inviteError } = await supabase
      .from('convites')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .single()

    if (inviteError || !convite) {
      return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 400 })
    }

    // Criar/atualizar utilizador no auth
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(convite.user_id, {
      password
    })

    if (authError) {
      console.log('[accept-invite] Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Marcar convite como usado
    await supabase.from('convites').update({ usado: true }).eq('token', token)

    // Criar perfil se não existir
    try {
      const { data: existingProfile } = await supabase
        .from('perfis')
        .select('id')
        .eq('id', convite.user_id)
        .single()

      if (!existingProfile) {
        const { error: perfilError } = await supabase.from('perfis').insert({
          id: convite.user_id,
          nome_completo: convite.nome,
          email: convite.email,
          setor: convite.setor,
          papel: convite.funcao,
          ativo: true
        })
        
        if (perfilError) {
          console.error('[accept-invite] Perfil error:', perfilError)
        } else {
          // Verificar se já existe funcionário com este email (criado via onboarding)
          const { data: funcExistente } = await supabase
            .from('funcionarios')
            .select('id')
            .eq('email', convite.email)
            .is('deleted_at', null)
            .maybeSingle()

          if (funcExistente) {
            // Vincular funcionário existente ao auth user
            await supabase.from('funcionarios').update({
              user_id: convite.user_id,
              cargo: convite.funcao,
              data_admissao: new Date().toISOString().split('T')[0],
            }).eq('id', funcExistente.id)
          } else {
            await supabase.from('funcionarios').insert({
              id: convite.user_id,
              nome_completo: convite.nome,
              email: convite.email,
              cargo: convite.funcao,
              data_admissao: new Date().toISOString().split('T')[0],
              ativo: true,
              criado_por: convite.user_id
            })
          }
        }
      }
    } catch (e) {
      console.error('[accept-invite] Profile check error:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[accept-invite] ERRO:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}