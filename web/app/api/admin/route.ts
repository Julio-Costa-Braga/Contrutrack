import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, email, userId, password, nome } = body

    const supabase = createAdminClient()

    if (action === 'resetPassword') {
      if (!email) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    if (action === 'updatePassword') {
      if (!userId || !password) return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
      const { error } = await supabase.auth.admin.updateUserById(userId, { password })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    if (action === 'inviteUser') {
      console.log('[inviteUser] body:', body)
      if (!email) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
      
      try {
        const { data: perfilExistente } = await supabase.from('perfis').select('id').eq('email', email).single()
        if (perfilExistente) {
          return NextResponse.json({ error: 'Este email já está registado' }, { status: 400 })
        }
      } catch (e) {
        // ignore - perfil não existe
      }

      const { setor, funcao } = body
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
      
      console.log('[inviteUser] creating user:', email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password: tempPassword,
        user_metadata: { nome: nome || email.split('@')[0] }
      })

      if (authError) {
        console.error('[inviteUser] auth error:', authError)
        if (authError.message.includes('already been registered')) {
          return NextResponse.json({ error: 'Este email já está registado' }, { status: 400 })
        }
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      const token = crypto.randomUUID()
      console.log('[inviteUser] creating invite:', authData.user?.id)
      await supabase.from('convites').insert({
        user_id: authData.user?.id,
        email,
        nome: nome || email.split('@')[0],
        setor: setor || null,
        funcao: funcao || null,
        token,
        expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite?token=${token}`
      console.log('[inviteUser] inviteUrl:', inviteUrl)
      
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nome: nome || email.split('@')[0], token })
        })
      } catch (e) {
        console.error('Failed to send invite email:', e)
      }

      return NextResponse.json({ 
        invited: true, 
        user: authData.user,
        token
      })
    }

    if (action === 'updatePerfil') {
      const userId = body.userId
      console.log('updatePerfil body:', body)
      if (!userId) return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
      
      const { setor, funcao, ativo, nome_completo, acessos, alertas_pref } = body
      
      const updateData: any = {}
      if (setor !== undefined && setor) updateData.setor = setor
      if (funcao !== undefined && funcao) updateData.papel = funcao
      if (nome_completo !== undefined && nome_completo) updateData.nome_completo = nome_completo
      if (acessos !== undefined) updateData.acessos = acessos
      if (alertas_pref !== undefined) updateData.alertas_pref = alertas_pref
      
      console.log('updatePerfil updateData:', updateData, 'userId:', userId)
      
      const { error } = await supabase.from('perfis').update(updateData).eq('id', userId)
      
      if (error) {
        console.error('Update perfil error:', error)
        return NextResponse.json({ error: error.message, details: JSON.stringify(error) }, { status: 400 })
      }
      
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteUser') {
      if (!userId) return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 })
      
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteAuthError) return NextResponse.json({ error: deleteAuthError.message }, { status: 400 })
      
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}