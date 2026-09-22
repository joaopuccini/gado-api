import type { JwtService } from '@nestjs/jwt';
import type {
  FarmSessionClaims,
  FarmSessionIssuer,
  IssuedFarmSession,
} from '../application/ports/farm-session.ports';

export class JwtFarmSessionIssuer implements FarmSessionIssuer {
  constructor(private readonly jwt: JwtService) {}

  async sign(claims: FarmSessionClaims): Promise<IssuedFarmSession> {
    const accessToken = await this.jwt.signAsync({
      aud: 'gado-tenant',
      sub: claims.globalUserId,
      tenantId: claims.tenantId,
      organizationId: claims.organizationId,
      schemaName: claims.schemaName.value,
      usuarioLocalId: claims.localUserId,
      fazendaId: claims.farmId,
      role: claims.role,
      permissoes: claims.permissions,
    });
    return { accessToken, expiresIn: 3600 };
  }
}
