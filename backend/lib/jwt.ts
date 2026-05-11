import { SignJWT, jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'

export async function signJwt(payload: Record<string, any>) {
  const alg = 'HS256'
  const encoder = new TextEncoder()
  const key = encoder.encode(SECRET)
  const jwt = await new SignJWT(payload).setProtectedHeader({ alg }).setExpirationTime(EXPIRES_IN).sign(key)
  return jwt
}

export async function verifyJwt(token: string) {
  try {
    const alg = 'HS256'
    const encoder = new TextEncoder()
    const key = encoder.encode(SECRET)
    const { payload } = await jwtVerify(token, key)
    return payload as any
  } catch (err) {
    return null
  }
}
