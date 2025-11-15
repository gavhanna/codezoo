const HASHING_OPTIONS: Parameters<typeof Bun.password.hash>[1] = {
  algorithm: 'bcrypt',
  cost: 12,
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  return Bun.password.hash(password, HASHING_OPTIONS)
}

export async function verifyPassword(password: string, hash: string) {
  return Bun.password.verify(password, hash, HASHING_OPTIONS)
}
