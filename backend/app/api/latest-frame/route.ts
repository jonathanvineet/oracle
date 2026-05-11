export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { getLatestFrame } from '../../../lib/storage'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('user')
    if (!userId) return new NextResponse('user query param required', { status: 400 })
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
