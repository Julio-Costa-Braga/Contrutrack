// web/lib/actions/rh.ts
'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function criarLinkOnboarding({
  nome,
  email,
  documentos_necessarios,
}: {
  nome: string
  email: string
  documentos_necessarios?: string[]
}) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('onboarding_links')
    .insert({
      nome_candidato: nome,
      email_candidato: email,
      documentos_necessarios: documentos_necessarios || [
        'cartao_cidadao',
        'contrato_trabalho',
        'atestado_medico',
        'formacao_seguranca',
        'certificado_manobra',
      ],
    })
    .select('token').single()

  if (error || !data) return { error: error?.message }
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/${data.token}`

  // Enviar email com o link
  let emailError: string | null = null
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@construtrack.pt'
    await resend.emails.send({
      from: `ConstruTrack <${fromEmail}>`,
      to: email,
      subject: 'Complete o seu onboarding - ConstruTrack',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#1e293b;">Olá ${nome}!</h2>
          <p style="color:#475569;">Recebemos os seus dados e criámos o seu link de onboarding.</p>
          <p style="color:#475569;">Clique no botão abaixo para fazer upload dos seus documentos:</p>
          <a href="${link}" style="display:inline-block;background:#1e293b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Aceder ao Onboarding</a>
          <p style="color:#94a3b8;font-size:12px;">Este link expira em 7 dias. Se não foi você, ignore este email.</p>
        </div>
      `,
    })
  } catch (emailErr: any) {
    emailError = emailErr.message
    console.error('Erro ao enviar email:', emailErr)
  }

  return { link, emailError }
}

export async function uploadDocumentoFuncionario(formData: FormData) {
  const supabase = createAdminClient()

  const ficheiro = formData.get('ficheiro') as File
  const funcionario_id = formData.get('funcionario_id') as string
  const tipo = formData.get('tipo') as string
  const nome = formData.get('nome') as string
  const data_validade = formData.get('data_validade') as string | null

  // Upload para Supabase Storage
  const path = `${funcionario_id}/${tipo}/${Date.now()}_${ficheiro.name}`
  const { error: uploadError } = await supabase.storage
    .from('documentos-rh').upload(path, ficheiro)
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('documentos-rh').getPublicUrl(path)

  // Inserir registo na base de dados
  const { error } = await supabase.from('documentos_funcionario').insert({
    funcionario_id,
    tipo: tipo as any,
    nome,
    data_validade: data_validade || null,
    ficheiro_url: urlData.publicUrl,
    ficheiro_path: path,
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function criarFuncionario(data: {
  nome_completo: string
  nif: string
  niss?: string
  email?: string
  telefone?: string
  cargo?: string
  data_admissao?: string
}) {
  const supabase = createAdminClient()

  // Criar path do dossiê: NOME_APELIDO_NIF
  const nomeDossie = data.nome_completo
    .toUpperCase().replace(/\s+/g, '_')
  const dossie_path = `${nomeDossie}_${data.nif}/`

  const { data: func, error } = await supabase
    .from('funcionarios')
    .insert({ ...data, dossie_path })
    .select('id').single()

  if (error) return { error: error.message }
  return { id: func.id }
}
