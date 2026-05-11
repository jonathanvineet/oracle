export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { verifyJwt } from '../../../lib/jwt'
import { setLatestFrame } from '../../../lib/storage'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer ')) return new NextResponse('Unauthorized', { status: 401 })
    const token = auth.slice(7)
    const payload = await verifyJwt(token)
    if (!payload) return new NextResponse('Unauthorized', { status: 401 })
    const userId = payload.sub
    const contentType = req.headers.get('content-type') || 'image/jpeg'
    const buffer = await req.arrayBuffer()
    await setLatestFrame(userId as string, Buffer.from(buffer), contentType)
    return new NextResponse('OK')
  } catch (err) {
    return new NextResponse('Error', { status: 500 })
  }
}
