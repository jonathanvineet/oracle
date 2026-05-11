import { NextResponse } from 'next/server'
import { json } from 'stream/consumers'
import { verifyPassword, getUserByUsername } from '../../../lib/users'
import { signJwt } from '../../../lib/jwt'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json({ error: 'username and password required' }, { status: 400 })
    }
    const user = await getUserByUsername(username)
    if (!user) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
    const token = await signJwt({ sub: user.id, username: user.username })
    return NextResponse.json({ token })
  } catch (err) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
