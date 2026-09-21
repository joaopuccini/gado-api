import * as bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../application/ports/password-hasher';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
  }
}
