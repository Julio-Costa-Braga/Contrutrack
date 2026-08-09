import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { provider, config } = body

  try {
    if (provider === 'trello') {
      // Testar Trello
      const res = await fetch(`https://api.trello.com/1/members/me?key=${config.api_key}&token=${config.token}`)
      if (!res.ok) throw new Error('Credenciais Trello inválidas')
      const data = await res.json()
      return NextResponse.json({ success: true, data: { boards: data.idBoards } })
    }
    
    if (provider === 'jira') {
      // Testar Jira
      const res = await fetch(`https://${config.domain}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.email}:${config.api_token}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Credenciais Jira inválidas')
      return NextResponse.json({ success: true })
    }

    if (provider === 'monday') {
      // Testar Monday
      const res = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': config.api_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: '{ me { id name } }' })
      })
      const data = await res.json()
      if (data.errors) throw new Error('Credenciais Monday inválidas')
      return NextResponse.json({ success: true })
    }

    if (provider === 'notion') {
      // Testar Notion
      const res = await fetch('https://api.notion.com/v1/users/me', {
        headers: { 'Authorization': `Bearer ${config.api_token}` }
      })
      if (!res.ok) throw new Error('Credenciais Notion inválidas')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provider não suportado' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}