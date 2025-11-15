import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const HASH_PREFIX = 'scrypt'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH)
  const derivedKey = scryptSync(password, salt, KEY_LENGTH)
  return `${HASH_PREFIX}:${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string) {
  const [prefix, saltHex, keyHex] = hash.split(':')
  if (prefix !== HASH_PREFIX || !saltHex || !keyHex) {
    return false
  }

  const salt = Buffer.from(saltHex, 'hex')
  const storedKey = Buffer.from(keyHex, 'hex')
  const computedKey = scryptSync(password, salt, KEY_LENGTH)
  return timingSafeEqual(storedKey, computedKey)
}
