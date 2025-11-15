type PasswordAlgorithm = 'bcrypt' | 'argon2id'

interface BunPasswordOptions {
  algorithm?: PasswordAlgorithm
  cost?: number
  memoryLimit?: number
  timeCost?: number
}

interface BunPassword {
  hash(
    password: string | ArrayBufferView,
    options?: BunPasswordOptions,
  ): Promise<string>
  verify(
    password: string | ArrayBufferView,
    hash: string,
    options?: BunPasswordOptions,
  ): Promise<boolean>
}

declare const Bun: {
  password: BunPassword
}
