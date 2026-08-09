import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const sbCookie = allCookies.find(c => c.name.includes('sb-') && c.name.includes('auth-token'))
  
  let user = null
  if (sbCookie) {
    try {
      const tokenData = JSON.parse(sbCookie.value)
      user = { hasAccessToken: !!tokenData.access_token }
    } catch {
      user = { parseError: true }
    }
  }
  
  return NextResponse.json({
    cookies: allCookies.map(c => c.name),
    cookieCount: allCookies.length,
    hasSbAuthToken: !!sbCookie,
    user
  })
}
