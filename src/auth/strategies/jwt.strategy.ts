import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestContext } from '../../common/context';

interface JwtPayload {
    sub: number;
    email: string;
    nome: string;
    admin: boolean;
    suporte: boolean;
    fazendaId: number;
    permissoes: Record<string, boolean>;
}

/**
 * JWT Strategy — validates and verifies JWT tokens.
 * Uses jwt.verify() (not jwt.decode()!) — fixing the original auth vulnerability.
 *
 * Also enriches the RequestContext with user/fazenda data
 * for AsyncLocalStorage-based tracing.
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
        // Enrich AsyncLocalStorage context with user data
        RequestContext.set({
            userId: payload.sub,
            fazendaId: payload.fazendaId,
            userEmail: payload.email,
        });

        return {
            id: payload.sub,
            email: payload.email,
            nome: payload.nome,
            admin: payload.admin,
            suporte: payload.suporte,
            fazendaId: payload.fazendaId,
            permissoes: payload.permissoes,
        };
    }
}
