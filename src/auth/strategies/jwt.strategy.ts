import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ResolveTenantContextUseCase } from '../../identity-access/application/use-cases/resolve-tenant-context.use-case';

export interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
  tenantId: string;
  schemaName?: string;
  usuarioLocalId?: number;
  fazendaId: number;
  role: string;
  permissoes?: string[];
  aud?: string | string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly resolveTenantContext: ResolveTenantContextUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const path = request.path || request.url;
    const isAdminRoute = path.startsWith('/api/v1/admin');
    const audiences = Array.isArray(payload.aud) ? payload.aud : (payload.aud ? [payload.aud] : []);

    if (isAdminRoute && !audiences.includes('gado-admin')) {
      throw new UnauthorizedException('Token inválido para rotas administrativas');
    }
    
    if (!isAdminRoute && !audiences.includes('gado-app')) {
      throw new UnauthorizedException('Token inválido para rotas de tenant');
    }

    const context = await this.resolveTenantContext.execute({
      verifiedSubject: payload.sub,
      tenantId: payload.tenantId,
      requestedFarmId: Number(payload.fazendaId),
      requestedSchemaName: payload.schemaName,
      hostTenant: this.transportTenantHint(request),
    });

    return {
      sub: context.globalUserId,
      email: payload.email,
      nome: payload.nome,
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      usuarioLocalId: context.localUserId,
      fazendaId: context.farmId,
      role: payload.role,
      permissoes: [...context.permissions],
    };
  }

  private transportTenantHint(request: Request): string | undefined {
    const header = request.headers['x-tenant'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim().toLowerCase();
    }

    const hostname = request.hostname.toLowerCase();
    const baseDomain = this.configService
      .get<string>('TENANT_BASE_DOMAIN', 'gado.com.br')
      .toLowerCase();
    if (!hostname.endsWith(`.${baseDomain}`)) return undefined;

    const subdomain = hostname.slice(0, -(baseDomain.length + 1));
    return subdomain && !subdomain.includes('.') ? subdomain : undefined;
  }
}
