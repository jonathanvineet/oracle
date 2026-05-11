import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Secure headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'no-referrer')
  res.headers.set('Permissions-Policy', 'geolocation=()')
  res.headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; connect-src 'self' https:; style-src 'self' 'unsafe-inline';")

  // Force HTTPS
  if (req.headers.get('x-forwarded-proto') === 'http') {
    const url = req.nextUrl.clone()
    url.protocol = 'https'
    return NextResponse.redirect(url)
  }

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    const r = new NextResponse(null, { status: 204 })
    r.headers.set('Access-Control-Allow-Origin', '*')
    r.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    r.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return r
  }

  return res
}

export const config = {
  matcher: '/api/:path*'
}
