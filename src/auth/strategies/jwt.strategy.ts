import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestContext } from '../../common/context';

export interface JwtPayload {
    sub: string; // ID Global
    email: string;
    nome: string;
    tenantId: string;
    schemaName: string;
    usuarioLocalId: number;
    fazendaId: number;
    role: string;
    permissoes: string[];
}

/**
 * JWT Strategy — validates and verifies JWT tokens.
 * Enriches the RequestContext with user/tenant data
 * for AsyncLocalStorage-based tracing and schema resolution.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    validate(payload: JwtPayload) {
        // Enrich AsyncLocalStorage context with tenant data
        RequestContext.set({
            userId: payload.usuarioLocalId, // Prefer local user id for tenant operations
            globalUserId: payload.sub,
            tenantId: payload.tenantId,
            schemaName: payload.schemaName,
            fazendaId: payload.fazendaId,
            userEmail: payload.email,
        });

        return payload; // Retorna o payload completo para o req.user
    }
}
