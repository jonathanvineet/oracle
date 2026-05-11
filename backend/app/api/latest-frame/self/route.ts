export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { verifyJwt } from '../../../lib/jwt'
import { getLatestFrame } from '../../../lib/storage'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer ')) return new NextResponse('Unauthorized', { status: 401 })
    const token = auth.slice(7)
    const payload = await verifyJwt(token)
    if (!payload) return new NextResponse('Unauthorized', { status: 401 })
    const userId = payload.sub as string
    const frame = await getLatestFrame(userId)
    if (!frame) return new NextResponse(null, { status: 204 })
    return new NextResponse(frame.buffer, {
      status: 200,
      headers: {
        'Content-Type': frame.contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    return new NextResponse('Error', { status: 500 })
  }
}
