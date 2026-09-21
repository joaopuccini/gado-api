import * as bcrypt from 'bcrypt';
import type { AdminPasswordVerifier } from '../application/ports/admin-login.ports';

export class BcryptAdminPasswordVerifier implements AdminPasswordVerifier {
  compare(plainText: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainText, passwordHash);
  }
}
