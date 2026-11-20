import bcrypt from 'bcryptjs'
import type { PasswordHasher } from '../domain/puertos'

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly costo = 12) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.costo)
  }

  coincide(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
