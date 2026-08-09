import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  return NextResponse.json({ user })
}