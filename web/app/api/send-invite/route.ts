import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const { email, nome, token } = await request.json()

    if (!email || !token) {
      return NextResponse.json({ error: 'Email e token são obrigatórios' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite?token=${token}`

    await resend.emails.send({
      from: 'ConstruTrack <onboarding@resend.dev>',
      to: email,
      subject: 'Convite para entrar no ConstruTrack',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Olá${nome ? ` ${nome}` : ''}!</h2>
          <p>Foi convidado para entrar no ConstruTrack.</p>
          <p>Clique no link abaixo para aceitar o convite e definir a sua senha:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Aceitar Convite
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este link expira em 7 dias.<br>
            Se não solicitou este convite, pode ignorar este email.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send invite email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
