// web/lib/supabase/server.ts
// Cliente para uso no servidor (Server Components, Route Handlers, Server Actions)
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createClient() {
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente admin (service role) — apenas para Server Actions seguras
export function createAdminClient() {
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
        }
      }
    }
  )
}

// Cliente para Server Components com autenticação
export async function createAuthenticatedClient() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const tokenCookie = allCookies.find(c => c.name.includes('auth-token'))
  
  if (!tokenCookie) {
    return createClient()
  }
  
  let tokenData = null
  try {
    tokenData = JSON.parse(tokenCookie.value)
  } catch {
    return createClient()
  }
  
  if (!tokenData?.access_token) {
    return createClient()
  }
  
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      }
    }
  )
}
