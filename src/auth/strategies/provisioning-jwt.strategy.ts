import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface ProvisioningJwtPayload {
  readonly sub: string;
  readonly provisioningRunId: string;
  readonly purpose: 'provisioning';
  readonly aud?: string | readonly string[];
}

const cookieCredential = (request: Request): string | null => {
  const cookie = request.headers.cookie;
  const match = cookie?.match(/(?:^|;\s*)gado_provisioning=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

@Injectable()
export class ProvisioningJwtStrategy extends PassportStrategy(
  Strategy,
  'provisioning-jwt',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieCredential,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      audience: 'gado-provisioning',
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: ProvisioningJwtPayload) {
    if (
      payload.purpose !== 'provisioning' ||
      !payload.sub?.trim() ||
      payload.provisioningRunId !== request.params.runId
    ) {
      throw new UnauthorizedException('Credencial de provisionamento inválida');
    }
    return { sub: payload.sub, purpose: payload.purpose };
  }
}
