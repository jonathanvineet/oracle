import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

type User = {
  id: string
  username: string
  passwordHash: string
}

const users = new Map<string, User>()

// seed a default user: admin / password
;(async () => {
  const pw = process.env.SEED_PASSWORD || 'password'
  const hash = await bcrypt.hash(pw, 10)
  const id = 'user-admin'
  users.set(id, { id, username: 'admin', passwordHash: hash })
})()

export async function createUser(username: string, password: string) {
  const id = randomUUID()
  const hash = await bcrypt.hash(password, 10)
  const user = { id, username, passwordHash: hash }
  users.set(id, user)
  return user
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function getUserByUsername(username: string) {
  for (const user of users.values()) {
    if (user.username === username) return user
  }
  return null
}

export async function getUserById(id: string) {
  return users.get(id) || null
}
