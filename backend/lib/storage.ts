type Frame = { buffer: Uint8Array; contentType: string; ts: number }

const latestFrames: Map<string, Frame> = new Map()

export async function setLatestFrame(userId: string, buffer: Buffer, contentType: string) {
  latestFrames.set(userId, { buffer: new Uint8Array(buffer), contentType, ts: Date.now() })
}

export async function getLatestFrame(userId: string) {
  const f = latestFrames.get(userId)
  if (!f) return null
  return { buffer: f.buffer, contentType: f.contentType, ts: f.ts }
}

export async function clearLatestFrame(userId: string) {
  latestFrames.delete(userId)
}
