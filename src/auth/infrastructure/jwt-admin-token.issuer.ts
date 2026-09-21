import type { JwtService } from '@nestjs/jwt';
import type {
  AdminTokenClaims,
  AdminTokenIssuer,
} from '../application/ports/admin-login.ports';

export class JwtAdminTokenIssuer implements AdminTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  sign(claims: AdminTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims);
  }
}
